import { Kire } from "kire";
import type { KireKoaOptions } from "./types";

/** Build (or reuse) a Kire engine and load the configured plugins/globals. */
export function buildEngine(options: KireKoaOptions): Kire<boolean> {
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
