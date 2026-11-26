import { Kire } from "kire";
import type { KireH3Options, WireIntegration } from "./types";

export * from "./types";

/** The Kire h3 integration handle returned by {@link kireH3}. */
export interface KireH3 {
	/** The Kire engine this integration configured. */
	engine: Kire<boolean>;
	/**
	 * Render a (dotted) Kire view path and return it as an HTML `Response`,
	 * ready to be returned directly from an h3 handler.
	 */
	view(name: string, data?: Record<string, unknown>): Promise<Response>;
	/**
	 * An h3 middleware. When the `wire` option is set it serves the Kirewire
	 * update endpoint (POST) and client runtime (GET); otherwise it just
	 * passes the request through to the next handler.
	 */
	middleware: (event: any, next: () => any) => any;
}

/** Build (or reuse) a Kire engine and load the configured plugins/globals. */
function buildEngine(options: KireH3Options): Kire<boolean> {
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

/**
 * Wire Kire into an [h3](https://h3.dev) app.
 *
 * ```ts
 * import { H3, serve } from "h3";
 * import { kireH3 } from "@kirejs/h3";
 *
 * const kire = kireH3({ views: "resources/views" });
 * const app = new H3();
 *
 * // Optional: serve Kirewire endpoints (POST /_wire, GET /kirewire.js).
 * app.use(kire.middleware);
 *
 * // Return a rendered view straight from a handler — `view()` yields an
 * // `text/html` Response, which h3 sends as-is.
 * app.get("/", () => kire.view("home", { title: "Hi" }));
 * app.get("/about", () => kire.view("pages.about", { who: "Kire" }));
 * ```
 */
export function kireH3(options: KireH3Options): KireH3 {
	const engine = buildEngine(options);
	const inlineWire = options.wire
		? prepareInlineWire(engine, options.wire)
		: null;

	const view = (
		name: string,
		data: Record<string, unknown> = {},
	): Promise<Response> =>
		Promise.resolve(engine.view(name, data)).then(
			(html) =>
				new Response(html as string, {
					headers: { "content-type": "text/html; charset=utf-8" },
				}),
		);

	const middleware = (event: any, next: () => any): any => {
		if (inlineWire) {
			const handled = inlineWire(event);
			if (handled) return handled;
		}
		return next();
	};

	return { engine, view, middleware };
}

/**
 * Load wire into the engine and return an inline handler that serves the wire
 * endpoints. Returns a `Response` (or promise of one) when it handled the
 * request, or `null` to let the next handler run.
 */
function prepareInlineWire(engine: Kire<boolean>, wire: WireIntegration) {
	const wirePkg = requireWire();
	const wirePath = wire.path ?? "/_wire";
	const scriptUrl = wire.scriptUrl ?? "/kirewire.js";
	engine.plugin(
		wirePkg.kirewirePlugin(wire.instance, { scriptUrl, path: wirePath }),
	);
	const clientScript = resolveClientScript(wire);

	return (event: any): Promise<Response> | Response | null => {
		const method: string = event.req.method;
		const pathname: string = event.url.pathname;

		if (method === "POST" && pathname === wirePath) {
			return event.req
				.text()
				.then((body: string) =>
					Promise.resolve(wirePkg.handleUpdate(wire.instance, body)).then(
						(result: any) =>
							Response.json(result.body, { status: result.status }),
					),
				);
		}

		if (method === "GET" && pathname === scriptUrl && clientScript) {
			const { readFileSync } = require("node:fs");
			return new Response(readFileSync(clientScript), {
				headers: {
					"content-type": "text/javascript; charset=utf-8",
				},
			});
		}

		return null;
	};
}

/** Require `@kirejs/wire`, with a clear error when it is not installed. */
function requireWire(): any {
	try {
		return require("@kirejs/wire");
	} catch {
		throw new Error(
			"@kirejs/h3: the `wire` option requires `@kirejs/wire` to be installed.",
		);
	}
}

/**
 * The local file to serve as the Kirewire client runtime: the explicit
 * `clientScript`, or the built auto-boot bundle from `@kirejs/wire`.
 */
function resolveClientScript(wire: WireIntegration): string | null {
	if (wire.clientScript) return wire.clientScript;
	try {
		const nodePath = require("node:path");
		const { existsSync } = require("node:fs");
		const main = require
			.resolve(["@kirejs", "wire"].join("/"))
			.replace(/\\/g, "/");
		const marker = main.includes("/dist/")
			? "/dist/"
			: main.includes("/src/")
				? "/src/"
				: null;
		const pkgDir = marker
			? main.slice(0, main.indexOf(marker))
			: nodePath.dirname(main);
		// The standalone auto-boot IIFE (not the ESM library index.js).
		const candidate = nodePath.join(pkgDir, "dist", "client", "auto.js");
		return existsSync(candidate) ? candidate : null;
	} catch {
		return null;
	}
}
