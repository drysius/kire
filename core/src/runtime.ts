import { createHash } from "node:crypto";
import { KireError } from "./utils/error";
import type { Kire } from "./kire";
import type { KireContext, KireFileMeta, KireHookName } from "./types";
import { processElements } from "./utils/elements-runner";
import { escapeHtml } from "./utils/html";

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
        $md5: (str: string) => createHash("md5").update(str).digest("hex"),
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
            if (hooks.length === 0) return;
            
            // Check if any hook is async
            const hasAsync = hooks.some(h => (h as any).constructor.name === 'AsyncFunction');
            if (hasAsync) {
                return (async () => {
                    for (let i = 0; i < hooks.length; i++) {
                        const res = hooks[i]!($ctx);
                        if (res instanceof Promise) await res;
                    }
                })();
            } else {
                for (let i = 0; i < hooks.length; i++) {
                    hooks[i]!($ctx);
                }
            }
        },

        $merge: ($kire.$stream || meta.controller) ? async (fn: any) => {
            const originalAdd = $ctx.$add;
            let buffer = "";
            $ctx.$add = (str: any) => { buffer += str; $ctx.$response += str; };
            const prevRes = $ctx.$response;
            $ctx.$response = "";
            const res = fn($ctx);
            if (res instanceof Promise) await res;
            $ctx.$add = originalAdd;
            $ctx.$response = prevRes + buffer;
        } : (fn: any) => {
            const prevRes = $ctx.$response;
            $ctx.$response = "";
            const res = fn($ctx);
            if (res instanceof Promise) {
                return res.then(() => {
                    const inner = $ctx.$response;
                    $ctx.$response = prevRes + inner;
                });
            }
            const inner = $ctx.$response;
            $ctx.$response = prevRes + inner;
        },
        
        $fork: () => {
            const newCtx = { ...$ctx };
            newCtx.$merge = $ctx.$merge;
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

    const mainFn = meta.execute as any;
    const isAsync = mainFn._isAsync !== false;

	const execute = () => {
        if ($kire.$directives.size > 0 && !meta.children) {
            for (const directive of $kire.$directives.values()) {
                if (directive.onInit) directive.onInit($ctx);
            }
        }

		const run = () => {
            try {
                const res = mainFn.call($ctx.$props, $ctx);
                if (res instanceof Promise) {
                    return res.then((r: any) => {
                        if (!meta.controller && meta.usedElements && meta.usedElements.size > 0) {
                            const pel = processElements($ctx);
                            if (pel instanceof Promise) return pel.then(h => $ctx.$response = h);
                            $ctx.$response = pel;
                        }
                        return $ctx.$response;
                    }).catch((e: any) => {
                        const kireError = new KireError(e, $ctx.$file);
                        console.error(kireError.stack);
                        return $ctx.$response = $kire.renderError(kireError, $ctx);
                    });
                }
            } catch (e: any) {
                const kireError = new KireError(e, $ctx.$file);
                console.error(kireError.stack);
                return $ctx.$response = $kire.renderError(kireError, $ctx);
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
            const r = run();
            if (r instanceof Promise) {
                return r.then(async () => {
                    await $ctx.$emit("rendered");
                    await $ctx.$emit("after");
                    await $ctx.$emit("end");
                    return $ctx.$response;
                });
            }
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
                $ctx.$merge = async (fn: any) => {
                    const originalAdd = $ctx.$add;
                    let buffer = "";
                    $ctx.$add = (str: any) => { buffer += str; };
                    await fn($ctx);
                    $ctx.$add = originalAdd;
                    $ctx.$add(buffer);
				};

				try {
					const result = await execute();
					if (typeof result === "string" && result.includes("Error")) {
						controller.enqueue(encoder.encode(result));
					}
					if ($ctx.$deferred && $ctx.$deferred.length > 0) {
						await Promise.all($ctx.$deferred.map((t: any) => t()));
					}
					controller.close();
				} catch (e) {
					controller.error(e);
				}
			},
		});
	} else if (meta.controller) {
        const res = execute();
		return res instanceof Promise ? res.then(() => "") : ""; 
	} else {
		return execute();
	}
}
