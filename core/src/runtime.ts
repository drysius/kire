import { KireError } from "./utils/error";
import type { Kire } from "./kire";
import type { KireContext, KireFileMeta, KireHookName } from "./types";
import { processElements } from "./utils/elements-runner";
import { escapeHtml } from "./utils/html";
import { md5 } from "./utils/md5";

export default function (
	$kire: Kire,
	locals: Record<string, any>,
	meta: KireFileMeta,
): Promise<string | ReadableStream> | ReadableStream | string {
	
    // 1. Setup Context with Prototype Inheritance for Speed
    // $ctx inherits from $kire.$contexts (if exists) or just plain object
    // But typically $ctx is fresh per request.
    // $globals and $props inherit from Kire instance to allow shadowing without mutation.
    
    const $ctx: KireContext = {
        $kire,
        $file: meta,
        $response: "",
        $deferred: [],
        
        // Inherit globals/props from Kire instance
        $globals: Object.create($kire.$globals),
        $props: Object.create($kire.$props),
        
        // Methods
        $add: (str: string) => ($ctx.$response += str),
        $md5: md5,
        $escape: escapeHtml,
        $resolve: (path: string) => $kire.resolvePath(path),
        $typed: (key: string) => $ctx[key],
        
        $emptyResponse: () => {
            $ctx.$response = "";
            return $ctx;
        },

        // Optimized Hooks: Copy references from Kire instance
        // We create a new object for runtime hooks so we don't mutate the global definition
        $hooks: {
            before: [...$kire.$hooks.before],
            rendered: [...$kire.$hooks.rendered],
            after: [...$kire.$hooks.after],
            end: [...$kire.$hooks.end],
        },

        $on: (ev: KireHookName, cb) => {
            $ctx.$hooks[ev].push(cb);
        },

        $emit: async (ev: KireHookName) => {
            const hooks = $ctx.$hooks[ev];
            if (hooks.length > 0) {
                for (let i = 0; i < hooks.length; i++) {
                    await hooks[i]!($ctx);
                }
            }
        },

        $merge: async (fn) => {
            const prevRes = $ctx.$response;
            $ctx.$response = "";
            await fn($ctx);
            // $ctx.$response now contains the inner content
            const inner = $ctx.$response;
            $ctx.$response = prevRes + inner;
        },
        
        $fork: () => {
            // Shallow clone context
            const newCtx = { ...$ctx };
            // Re-bind specific methods if needed, but simple clone is usually enough for data
            // For $merge in fork, we need to be careful about buffer
            newCtx.$merge = async (fn) => {
                const prevRes = newCtx.$response;
                newCtx.$response = "";
                await fn(newCtx);
                const inner = newCtx.$response;
                newCtx.$response = prevRes + inner;
            };
            return newCtx;
        },

        // Helper for dynamic requirements
        $require: async (path, locals) => {
             return $kire.view(path, locals, meta.controller) as Promise<string>;
        }
    } as any;

    // Apply locals to props (shadowing global props)
    if (locals) {
        Object.assign($ctx.$props, locals);
    }

	// 2. Define Execution Logic
    const isAsync = (meta.execute as any)._isAsync !== false;

	const execute = () => {
        // Directives Init
        if ($kire.$directives.size > 0) {
            for (const directive of $kire.$directives.values()) {
                if (directive.onInit) {
                    const res = directive.onInit($ctx);
                    if (res instanceof Promise && isAsync) {
                        // We can't easily wait for it here if we want to be truly sync
                        // But usually onInit is used for globals which are already there.
                    }
                }
            }
        }

		const run = () => {
            try {
                const res = $ctx.$file.execute.call($ctx.$props, $ctx);
                if (res instanceof Promise) return res;
            } catch (e: any) {
                const kireError = new KireError(e, $ctx.$file);
                console.error(kireError.stack);
                return $kire.renderError(kireError, $ctx);
            }

            if (!meta.controller && meta.usedElements && meta.usedElements.size > 0) {
                const res = processElements($ctx);
                if (res instanceof Promise) {
                    return res.then(html => {
                        $ctx.$response = html;
                        return $ctx.$response;
                    });
                }
                $ctx.$response = res;
            }

            return $ctx.$response;
        };

        if (isAsync) {
            return (async () => {
                await $ctx.$emit("before");
                await run();
                await $ctx.$emit("rendered");
                await $ctx.$emit("after");
                await $ctx.$emit("end");
                return $ctx.$response;
            })();
        } else {
            // Sync execution (assuming hooks are sync or not used for basic templates)
            $ctx.$emit("before"); 
            run();
            $ctx.$emit("rendered");
            $ctx.$emit("after");
            $ctx.$emit("end");
            return $ctx.$response;
        }
	};

	// 3. Handle Streaming vs Buffering
	const isStreamRoot = $kire.$stream && !meta.children && !meta.controller;

	if (isStreamRoot) {
		const encoder = new TextEncoder();
		return new ReadableStream({
			async start(controller) {
				$ctx.$add = (str) => controller.enqueue(encoder.encode(str));
                
                // Override merge for streaming: buffer locally then flush
				$ctx.$merge = async (fn) => {
                    const originalAdd = $ctx.$add;
                    let buffer = "";
                    $ctx.$add = (str) => { buffer += str; };
                    
                    await fn($ctx);
                    
                    $ctx.$add = originalAdd;
                    // Flush buffer to stream
                    $ctx.$add(buffer);
				};

				try {
					const result = await execute();
					if (typeof result === "string" && result.includes("Error")) {
                        // If error returned as string during streaming
						controller.enqueue(encoder.encode(result));
					}

					if ($ctx.$deferred && $ctx.$deferred.length > 0) {
						await Promise.all($ctx.$deferred.map((t) => t()));
					}

					controller.close();
				} catch (e) {
					controller.error(e);
				}
			},
		});
	} else if (meta.controller) {
        // We are a child in a stream
		const encoder = new TextEncoder();
		$ctx.$add = (str) => meta.controller!.enqueue(encoder.encode(str));
        
        // Merge in child stream: buffer locally (don't write to parent stream immediately if capturing)
        // But wait, $merge is used for capturing slots. Slots should NOT write to stream immediately.
        // So $merge must buffer.
		$ctx.$merge = async (fn) => {
			const originalAdd = $ctx.$add;
            let buffer = "";
            $ctx.$add = (str) => { 
                buffer += str; 
                // We also update $response for directives that read it
                $ctx.$response += str; 
            };
            const prevRes = $ctx.$response;
            $ctx.$response = "";

			await fn($ctx);

			$ctx.$add = originalAdd;
            // We do NOT flush buffer to stream here, because $merge implies capturing logic (like @slot).
            // The caller of $merge will decide what to do with $ctx.$response.
            // Restore response
            $ctx.$response = prevRes + buffer;
		};

        const res = execute();
		return res instanceof Promise ? res.then(() => "") : ""; 
	} else {
		return execute();
	}
}
