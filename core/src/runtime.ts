import { createHash } from "node:crypto";
import { KireError } from "./utils/error";
import type { Kire } from "./kire";
import type { KireContext, KireFileMeta, KireHookName } from "./types";
import { escapeHtml } from "./utils/html";

export default function (
	$kire: Kire,
	locals: Record<string, any>,
	meta: KireFileMeta,
): Promise<string | ReadableStream> | ReadableStream | string {
	
    // 1. Setup Context
    const $ctx: any = {
        $kire,
        $file: meta,
        $response: "",
        $deferred: [],
        
        $globals: Object.create($kire.$globals),
        $props: Object.create($kire.$props),
        
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
            
            const hasAsync = hooks.some((h: any) => (h as any).constructor.name === 'AsyncFunction');
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

        $merge: async (fn: any) => {
            const originalAdd = $ctx.$add;
            let buffer = "";
            $ctx.$add = (str: string) => { buffer += str; };
            const prevRes = $ctx.$response;
            $ctx.$response = "";
            
            const res = fn($ctx);
            if (res instanceof Promise) await res;
            
            $ctx.$add = originalAdd;
            $ctx.$response = prevRes + buffer;
            if (meta.controller) originalAdd(buffer);
        },
        
        $fork: () => {
            const fork = { ...$ctx, $response: "" };
            fork.$globals = $ctx.$globals;
            fork.$props = $ctx.$props;
            fork.$add = (str: string) => (fork.$response += str);
            fork.$emptyResponse = () => {
                fork.$response = "";
                return fork;
            };
            return fork;
        },

        $require: (path: any, locals: any) => {
             return $kire.view(path, locals, meta.controller) as Promise<string>;
        }
    };

    if (locals) Object.assign($ctx.$props, locals);

	const execute = () => {
        if ($kire.$directives.size > 0 && !meta.children) {
            for (const directive of $kire.$directives.values()) {
                if (directive.onInit) {
                    const res = directive.onInit($ctx);
                    if (res instanceof Promise) return res.then(() => executeFlow());
                }
            }
        }
        return executeFlow();
    };

    const executeFlow = () => {
        let hasError = false;
        const run = () => {
            try {
                const res = meta.execute.call($ctx.$props, $ctx);
                if (res instanceof Promise) {
                    return res.then(async () => {
                        return $ctx.$response;
                    });
                }
            } catch (e: any) {
                hasError = true;
                const kireError = new KireError(e, meta);
                if (!$kire.$silent) console.error(kireError.stack);
                $ctx.$response = $kire.renderError(kireError, $ctx);
            }
        };

        const b = $ctx.$emit("before");
        if (b instanceof Promise) {
            return b.then(async () => {
                await run();
                await $ctx.$emit("rendered");
                await $ctx.$emit("after");
                await $ctx.$emit("end");
                return $ctx.$response;
            });
        }

        const r = run();
        if (r instanceof Promise) {
            return r.then(async () => {
                const re = $ctx.$emit("rendered");
                if (re instanceof Promise) await re;
                const af = $ctx.$emit("after");
                if (af instanceof Promise) await af;
                const en = $ctx.$emit("end");
                if (en instanceof Promise) await en;
                return $ctx.$response;
            });
        }

        const re = $ctx.$emit("rendered");
        if (re instanceof Promise) {
            return re.then(async () => {
                await $ctx.$emit("after");
                await $ctx.$emit("end");
                return $ctx.$response;
            });
        }

        $ctx.$emit("after");
        $ctx.$emit("end");
        return $ctx.$response;
	};

	// 3. Handle Streaming
	const isStreamRoot = $kire.$stream && !meta.children && !meta.controller;

	if (isStreamRoot) {
		const encoder = new TextEncoder();
		return new ReadableStream({
			async start(controller) {
				$ctx.$add = (str: string) => controller.enqueue(encoder.encode(str));
				try {
					await execute();
					if ($ctx.$deferred?.length) {
						await Promise.all($ctx.$deferred.map((t: any) => t()));
					}
					controller.close();
				} catch (e) {
					controller.error(e);
				}
			},
		});
	}
    
    return execute();
}
