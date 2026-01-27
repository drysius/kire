import type { Kire } from "./kire";
import type { KireContext, KireFileMeta } from "./types";
import { processElements } from "./utils/elements-runner";
import { escapeHtml } from "./utils/html";
import { md5 } from "./utils/md5";

export default function (
	$kire: Kire,
	locals: Record<string, any>,
	meta: KireFileMeta,
): Promise<string | ReadableStream> | ReadableStream | string {
	// 1. Setup Base Context
	const $ctx = {
		...$kire.$contexts.toObject(),
		$response: "",
		get $res() {
			return $ctx.$response;
		},
	} as KireContext;

	$ctx.$kire = $kire;
	$ctx.$props = { ...$kire.$props.toObject(), ...locals };
	$ctx.$globals = $kire.$globals.toObject();
	$ctx.$file = meta;
	$ctx.$typed = (key) => $ctx[key];

	$ctx.$hooks = new Map();
	$ctx.$hooks.set("before", []);
	$ctx.$hooks.set("after", []);
	$ctx.$hooks.set("end", []);
	$ctx.$deferred = [];
	$ctx.$on = (ev, cb) => {
		const hooks = $ctx.$hooks.get(ev);
		if (hooks) {
			hooks.push(cb);
			$ctx.$hooks.set(ev, hooks);
		}
	};
	$ctx.$emit = async (ev) => {
		const hooks = $ctx.$hooks.get(ev);
		if (hooks && hooks.length > 0) {
			for (const hook of hooks) {
				await hook($ctx);
			}
		}
	};

	// Default buffering implementation
	$ctx.$add = (str) => ($ctx.$response += str);

	// Utils
	//@ts-expect-error ignore typed
	if (typeof $ctx.$require === "undefined") $ctx.$require = (path, locals) => {
			// If we are streaming, we need to pass the controller
			if (meta.controller) {
				return $kire.view(path, locals, meta.controller);
			}
			return $kire.view(path, locals);
		};
	if (typeof $ctx.$escape === "undefined")
		$ctx.$escape = (unsafe) => escapeHtml(unsafe);
	if (typeof $ctx.$md5 === "undefined") $ctx.$md5 = (str) => md5(str);
	if (typeof $ctx.$resolve === "undefined")
		$ctx.$resolve = (path) => $kire.resolvePath(path);

	// Default $merge (buffering)
	if (typeof $ctx.$merge === "undefined")
		$ctx.$merge = async (fn) => {
			const $pres = $ctx.$response;
			$ctx.$response = "";
			await fn($ctx);
			$ctx.$response = $pres + $ctx.$response;
		};

	$ctx.$fork = () => {
		const newCtx = { ...$ctx };
		newCtx.$merge = async (fn) => {
			const originalAdd = newCtx.$add;
			let buffer = "";
			newCtx.$add = (str) => {
				buffer += str;
				newCtx.$response = (newCtx.$response || "") + str;
			};
			const prevRes = newCtx.$response;
			newCtx.$response = "";

			await fn(newCtx);

			newCtx.$add = originalAdd;
			newCtx.$response = prevRes + buffer;
		};
		newCtx.$fork = $ctx.$fork;
		return newCtx;
	};

	// 2. Define Execution Logic
	const execute = async () => {
		// Only run inits if strictly necessary.
		if ($ctx.$kire.$directives.size > 0) {
			for (const directive of $ctx.$kire.$directives.values()) {
				if (directive.onInit) {
					await directive.onInit($ctx);
				}
			}
		}

		await $ctx.$emit("before");

		try {
			// use $props do bind and $ctx value
			await $ctx.$file.execute.call($ctx.$props, $ctx);
		} catch (e: any) {
			console.error(e);
			// In sync mode, return error HTML. In stream mode, this will be handled by wrapper.
			return $kire.renderError(e, $ctx);
		}

		await $ctx.$emit("after");
		await $ctx.$emit("end");

		// Post-process only if not streaming directly (handled in wrapper)
		let resultHtml = $ctx.$response;
		if (!meta.controller && $ctx.$kire.$elements.size > 0) {
			resultHtml = await processElements($ctx);
		}
		return resultHtml;
	};

	// 3. Handle Streaming vs Buffering
	const isStreamRoot = $kire.stream && !meta.children && !meta.controller;

	if (isStreamRoot) {
		const encoder = new TextEncoder();
		return new ReadableStream({
			async start(controller) {
				// Setup streaming $add
				$ctx.$add = (str) => controller.enqueue(encoder.encode(str));

				// Override $merge to buffer temporarily during stream
				$ctx.$merge = async (fn) => {
					const originalAdd = $ctx.$add;
					let buffer = "";
					$ctx.$add = (str) => {
						buffer += str;
						$ctx.$response += str;
					};
					// Preserve $response abstraction for directives that use it
					const prevRes = $ctx.$response;
					$ctx.$response = "";

					await fn($ctx);

					$ctx.$add = originalAdd;
					$ctx.$response = prevRes + buffer;
				};

				// We need to update $require to pass THIS controller
				// Override the previously set $require
				//@ts-expect-error need to renderize context
				$ctx.$require = (path, locals) => $kire.view(path, locals, controller as any);

				try {
					const result = await execute();
					// If execute returns an error string (caught exception), write it
					if (
						typeof result === "string" &&
						result.includes("Kire Runtime Error")
					) {
						controller.enqueue(encoder.encode(result));
					}

					// Handle deferred tasks
					if ($ctx.$deferred && $ctx.$deferred.length > 0) {
						await Promise.all($ctx.$deferred.map((t) => t()));
					}

					controller.close();
				} catch (e) {
					// Fallback for unexpected errors
					controller.error(e);
				}
			},
		});
	} else if (meta.controller) {
		// We are a child in a stream
		const encoder = new TextEncoder();
		$ctx.$add = (str) => meta.controller!.enqueue(encoder.encode(str));

		// Override $merge to buffer temporarily (same as above)
		$ctx.$merge = async (fn) => {
			const originalAdd = $ctx.$add;
			let buffer = "";
			$ctx.$add = (str) => {
				buffer += str;
				$ctx.$response += str;
			};
			const prevRes = $ctx.$response;
			$ctx.$response = "";

			await fn($ctx);

			$ctx.$add = originalAdd;
			$ctx.$response = prevRes + buffer;
		};

		return execute().then(() => ""); // Return empty string promise as content is streamed
	} else {
		// Standard buffering
		return execute();
	}
}
