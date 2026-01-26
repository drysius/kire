import type { Kire } from "./kire";
import type { KireContext, KireFileMeta } from "./types";
import { processElements } from "./utils/elements-runner";
import { escapeHtml } from "./utils/html";
import { md5 } from "./utils/md5";

export default async (
	$kire: Kire,
	locals: Record<string, any>,
	meta: KireFileMeta,
) => {
	// make kire runtime context
	const $ctx = {
		...$kire.$contexts.toObject(),
		$response: "",
		get $res() {
			return $ctx.$response;
		},
	} as KireContext;

	// Kire Main declarations
	$ctx.$kire = $kire;
	$ctx.$props = { ...$kire.$props.toObject(), ...locals };
	$ctx.$globals = $kire.$globals.toObject();
	$ctx.$file = meta;
	$ctx.$typed = (key) => $ctx[key];

	// Kire Hooks
	$ctx.$add = (str) => ($ctx.$response += str);
	$ctx.$hooks = new Map();
	$ctx.$hooks.set("before", []);
	$ctx.$hooks.set("after", []);
	$ctx.$hooks.set("end", []);
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

	// Kire Utils
	if (typeof $ctx.$require === "undefined")
		$ctx.$require = (path, locals) => $ctx.$kire.view(path, locals);
	if (typeof $ctx.$escape === "undefined")
		$ctx.$escape = (unsafe) => escapeHtml(unsafe);
	if (typeof $ctx.$md5 === "undefined") $ctx.$md5 = (str) => md5(str);
	if (typeof $ctx.$resolve === "undefined")
		$ctx.$resolve = (path) => $kire.resolvePath(path);
	if (typeof $ctx.$merge === "undefined")
		$ctx.$merge = async (fn) => {
			const $pres = $ctx.$response;
			$ctx.$response = "";
			await fn($ctx);
			$ctx.$response = $pres + $ctx.$response;
		};

	// Only run if strictly necessary.
	if ($ctx.$kire.$directives.size > 0) {
		for (const directive of $ctx.$kire.$directives.values()) {
			if (directive.onInit) {
				await directive.onInit($ctx);
			}
		}
	}

	try {
		// use $props do bind and $ctx value
		await $ctx.$file.execute.call($ctx.$props, $ctx);
	} catch (e: any) {
		console.error(e);
		return $kire.renderError(e, $ctx);
	}

	// Legacy hook support mapping to new event system
	await $ctx.$emit("before");

	// Execute 'after' hooks
	await $ctx.$emit("after");

	// Emit end
	await $ctx.$emit("end");

	let resultHtml = $ctx.$response;

	if ($ctx.$kire.$elements.size > 0) {
		resultHtml = await processElements($ctx);
	}

	return resultHtml;
};
