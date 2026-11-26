import type { Kire } from "kire";
import { buildEngine } from "./engine";
import type { KireKoaOptions, WireIntegration } from "./types";

export { buildEngine } from "./engine";
export * from "./types";

// Augment Koa's context so `ctx.view(...)` is typed for consumers.
declare module "koa" {
	interface DefaultContext {
		/** Render a (dotted) Kire view path and send it as HTML. */
		view(name: string, data?: Record<string, unknown>): Promise<unknown>;
	}
}

/** A Koa middleware carrying the Kire engine it configures. */
export interface KireKoaMiddleware {
	(ctx: any, next: () => Promise<unknown>): Promise<unknown>;
	/** The Kire engine this middleware installs. */
	engine: Kire<boolean>;
}

/**
 * Wire Kire into a Koa app. Idiomatic usage:
 *
 * ```ts
 * app.use(kireKoa({ views: "resources/views" }));
 * ```
 *
 * Adds `ctx.view("pages.about", data)` (renders a dotted Kire view path and
 * sends HTML) and optional one-line Kirewire setup via the `wire` option.
 *
 * When `wire` is enabled the update endpoint reads `ctx.request.body`, so an
 * upstream body parser (e.g. `koa-bodyparser`) must run before this middleware.
 */
export function kireKoa(options: KireKoaOptions): KireKoaMiddleware {
	const engine = buildEngine(options);
	const inlineWire = options.wire
		? prepareInlineWire(engine, options.wire)
		: null;

	const middleware = (async (ctx: any, next: () => Promise<unknown>) => {
		ctx.view = (name: string, data: Record<string, unknown> = {}) =>
			Promise.resolve(engine.view(name, data)).then((html) => {
				ctx.type = "html";
				ctx.body = html;
				return ctx;
			});

		if (inlineWire && (await inlineWire(ctx))) return;
		return next();
	}) as KireKoaMiddleware;
	middleware.engine = engine;
	return middleware;
}

/** Load wire into the engine and return an inline request handler for its endpoints. */
function prepareInlineWire(engine: Kire<boolean>, wire: WireIntegration) {
	const wirePkg = requireWire("@kirejs/koa");
	const wirePath = wire.path ?? "/_wire";
	const scriptUrl = wire.scriptUrl ?? "/kirewire.js";
	engine.plugin(
		wirePkg.kirewirePlugin(wire.instance, { scriptUrl, path: wirePath }),
	);
	const clientScript = resolveClientScript(wire);

	// Returns true when it handled the request (so the middleware stops).
	return async (ctx: any): Promise<boolean> => {
		if (ctx.method === "POST" && ctx.path === wirePath) {
			// Requires an upstream body parser (e.g. koa-bodyparser).
			const result = await wirePkg.handleUpdate(
				wire.instance,
				ctx.request.body,
			);
			ctx.status = result.status;
			ctx.body = result.body;
			return true;
		}
		if (ctx.method === "GET" && ctx.path === scriptUrl && clientScript) {
			const { readFileSync } = require("node:fs");
			ctx.type = "text/javascript; charset=utf-8";
			ctx.body = readFileSync(clientScript, "utf8");
			return true;
		}
		return false;
	};
}

function requireWire(pkg: string): any {
	try {
		return require("@kirejs/wire");
	} catch {
		throw new Error(
			`${pkg}: the \`wire\` option requires \`@kirejs/wire\` to be installed.`,
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
