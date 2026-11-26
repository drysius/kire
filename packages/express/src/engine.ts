import { Kire } from "kire";
import type { KireExpressOptions } from "./types";

/** Build (or reuse) a Kire engine and load the configured plugins/globals. */
export function buildEngine(options: KireExpressOptions): Kire<boolean> {
	const extension = options.extension ?? "kire";
	const engine =
		options.engine ??
		new Kire({
			root: options.views,
			extension,
			production: options.production,
		});

	for (const entry of options.plugins ?? []) {
		if (Array.isArray(entry)) engine.plugin(entry[0], entry[1]);
		else engine.plugin(entry);
	}

	for (const [name, value] of Object.entries(options.globals ?? {})) {
		engine.$global(name, value);
	}

	return engine;
}

/** Express-internal keys that must not leak into a view's locals. */
const EXPRESS_KEYS = new Set(["settings", "cache", "_locals", "_parents"]);

/** Strip Express's internal render options, keeping only user locals. */
export function cleanLocals(
	options: Record<string, unknown> = {},
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(options)) {
		if (!EXPRESS_KEYS.has(key)) out[key] = options[key];
	}
	return out;
}
