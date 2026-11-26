import {
	createFiveMHandler,
	FiveMBroadcaster,
	kirewirePlugin,
	type NuiCallback,
} from "@kirejs/wire";
import { Kire } from "kire";
import type { KireFivemOptions } from "./types";

export { createFiveMHandler, FiveMBroadcaster } from "@kirejs/wire";
export * from "./types";

function buildEngine(options: KireFivemOptions): Kire<boolean> {
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

export interface KireFivem {
	/** The configured Kire engine. */
	engine: Kire<boolean>;
	/** Render a NUI view to HTML. */
	render(
		view: string,
		data?: Record<string, unknown>,
	): string | Promise<string>;
	/**
	 * The `RegisterNuiCallback` handler for the Kirewire update endpoint:
	 * `RegisterNuiCallback(fivem.path, fivem.handler)`.
	 */
	handler: NuiCallback;
	/** NUI callback name (default `_wire`). */
	path: string;
	/**
	 * Build a server→NUI broadcaster from the host's `SendNuiMessage`. Pass it to
	 * `new Kirewire({ broadcaster })` for `@broadcast`/push effects.
	 */
	broadcaster(sendNuiMessage: (json: string) => void): FiveMBroadcaster;
}

/**
 * Wire Kire + Kirewire into a FiveM resource. FiveM has no HTTP server — the NUI
 * (browser UI) talks to the resource via `RegisterNuiCallback`, so this returns a
 * `handler` to register plus a `render()` for NUI pages:
 *
 * ```ts
 * import { Kirewire } from "@kirejs/wire";
 * import { kireFivem } from "@kirejs/fivem";
 *
 * const wire = new Kirewire({ secret: "…" });
 * wire.component(Counter);
 *
 * const fivem = kireFivem({ views: "views", wire: { instance: wire } });
 * RegisterNuiCallback(fivem.path, fivem.handler);
 *
 * // push the initial page to the NUI browser
 * SendNuiMessage(JSON.stringify({ type: "page", html: await fivem.render("counter") }));
 * ```
 */
export function kireFivem(options: KireFivemOptions): KireFivem {
	const engine = buildEngine(options);
	const path = options.wire.path ?? "_wire";
	const scriptUrl = options.wire.scriptUrl ?? "/kirewire.js";

	engine.plugin(
		kirewirePlugin(options.wire.instance, { scriptUrl, path: `/${path}` }),
	);

	return {
		engine,
		render: (view, data = {}) => engine.view(view, data),
		handler: createFiveMHandler(options.wire.instance, () => engine.fork()),
		path,
		broadcaster: (sendNuiMessage) => new FiveMBroadcaster(sendNuiMessage),
	};
}
