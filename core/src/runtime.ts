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
    const $ctx: any = {
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

        $on: (ev: KireHookName, cb: any) => {
            if (!$ctx.$hooks) {
                $ctx.$hooks = {
                    before: [...$kire.$hooks.before],
                    rendered: [...$kire.$hooks.rendered],
                    after: [...$kire.$hooks.after],
                    end: [...$kire.$hooks.end],
                };
            }
            $ctx.$hooks[ev].push(cb);
        },

        $emit: (ev: KireHookName) => {
            const hooks = ($ctx.$hooks || $kire.$hooks)[ev];
            if (hooks.length > 0) {
                return (async () => {
                    for (let i = 0; i < hooks.length; i++) {
                        const res = hooks[i]!($ctx);
                        if (res instanceof Promise) await res;
                    }
                })();
            }
        },

        $merge: async (fn: any) => {
            const prevRes = $ctx.$response;
            $ctx.$response = "";
            const res = fn($ctx);
            if (res instanceof Promise) await res;
            const inner = $ctx.$response;
            $ctx.$response = prevRes + inner;
        },
        
        $fork: () => {
            const newCtx = { ...$ctx };
            newCtx.$merge = async (fn: any) => {
                const prevRes = newCtx.$response;
                newCtx.$response = "";
                const res = fn(newCtx);
                if (res instanceof Promise) await res;
                const inner = newCtx.$response;
                newCtx.$response = prevRes + inner;
            };
            return newCtx;
        },

        $require: (path: any, locals: any) => {
             return $kire.view(path, locals, meta.controller) as Promise<string>;
        }
    };

    // Apply locals to props (shadowing global props)
    if (locals) {
        for (const key in locals) {
            $ctx.$props[key] = locals[key];
        }
    }

	// 2. Define Execution Logic
    const isAsync = (meta.execute as any)._isAsync !== false;

	const execute = () => {
        // Directives Init
        if ($kire.$directives.size > 0) {
            for (const directive of $kire.$directives.values()) {
                if (directive.onInit) {
                    directive.onInit($ctx);
                }
            }
        }

		const run = () => {
            try {
                const res = $ctx.$file.execute.call($ctx.$props, $ctx);
                if (res instanceof Promise) {
                    return res.then((r: any) => {
                        if (!meta.controller && meta.usedElements && meta.usedElements.size > 0) {
                            const pel = processElements($ctx);
                            if (pel instanceof Promise) return pel.then(h => $ctx.$response = h);
                            $ctx.$response = pel;
                        }
                        return $ctx.$response;
                    });
                }
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
                const b = $ctx.$emit("before");
                if (b instanceof Promise) await b;
                
                const r = run();
                if (r instanceof Promise) await r;
                
                const re = $ctx.$emit("rendered");
                if (re instanceof Promise) await re;
                
                const a = $ctx.$emit("after");
                if (a instanceof Promise) await a;
                
                const e = $ctx.$emit("end");
                if (e instanceof Promise) await e;
                
                return $ctx.$response;
            })();
        } else {
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
