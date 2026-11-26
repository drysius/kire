import path from "node:path";
import type { Kire } from "kire";
import { buildEngine, cleanLocals } from "./engine";
import type { KireExpressOptions } from "./types";

export { buildEngine } from "./engine";
export * from "./types";

// Augment Express's response so `res.view(...)` is typed for consumers.
declare global {
	namespace Express {
		interface Response {
			/** Render a (dotted) Kire view path and send it as HTML. */
			view(name: string, data?: Record<string, unknown>): Promise<unknown>;
		}
	}
}

/** An Express middleware carrying the Kire engine it configures. */
export interface KireExpressMiddleware {
	// biome-ignore lint/suspicious/noExplicitAny: Express req/res/next are external
	(req: any, res: any, next: () => void): void;
	/** The Kire engine this middleware installs. */
	engine: Kire<boolean>;
}

/** Map an absolute view file back to a Kire view name (relative, no extension). */
function toViewName(file: string, views: string, extension: string): string {
	let rel = path.relative(views, file).replace(/\\/g, "/");
	if (rel.endsWith(`.${extension}`))
		rel = rel.slice(0, -(extension.length + 1));
	return rel;
}

// biome-ignore lint/suspicious/noExplicitAny: duck-typing an Express app
function isExpressApp(value: any): boolean {
	return (
		!!value &&
		typeof value === "function" &&
		typeof value.use === "function" &&
		typeof value.engine === "function"
	);
}

/** Register Kire as the app's view engine (so `res.render` works). */
function configureViewEngine(
	// biome-ignore lint/suspicious/noExplicitAny: Express app is external
	app: any,
	engine: Kire<boolean>,
	options: KireExpressOptions,
): void {
	const extension = options.extension ?? "kire";
	app.engine(
		extension,
		(
			file: string,
			opts: Record<string, unknown>,
			cb: (e: unknown, html?: string) => void,
		) => {
			Promise.resolve(
				engine.view(
					toViewName(file, options.views, extension),
					cleanLocals(opts),
				),
			).then(
				(html) => cb(null, html as string),
				(err) => cb(err),
			);
		},
	);
	app.set("views", options.views);
	app.set("view engine", extension);
}

/** Add `res.view(name, data)` — renders a (dotted) view path and sends HTML. */
// biome-ignore lint/suspicious/noExplicitAny: Express res is external
function attachResView(res: any, engine: Kire<boolean>): void {
	res.view = (name: string, data: Record<string, unknown> = {}) =>
		Promise.resolve(engine.view(name, data)).then((html) =>
			res.type("html").send(html),
		);
}

/**
 * Wire Kire into an Express app. Two equivalent call styles:
 *
 * ```ts
 * // 1) middleware style (idiomatic Express)
 * app.use(kireExpress({ views: "resources/views" }));
 *
 * // 2) direct style — returns the engine
 * const engine = kireExpress(app, { views: "resources/views" });
 * ```
 *
 * Either way you get Kire as the view engine (`res.render(name, data)` like
 * EJS/Eta), `res.view("pages.about", data)` for dotted paths, and optional
 * one-line Kirewire setup via the `wire` option.
 */
export function kireExpress(options: KireExpressOptions): KireExpressMiddleware;
export function kireExpress(
	// biome-ignore lint/suspicious/noExplicitAny: Express app is external
	app: any,
	options: KireExpressOptions,
): Kire<boolean>;
export function kireExpress(
	// biome-ignore lint/suspicious/noExplicitAny: overloaded first argument
	appOrOptions: any,
	maybeOptions?: KireExpressOptions,
): Kire<boolean> | KireExpressMiddleware {
	// Direct style: kireExpress(app, options).
	if (isExpressApp(appOrOptions)) {
		const app = appOrOptions;
		const options = maybeOptions as KireExpressOptions;
		const engine = buildEngine(options);
		if (options.wire) setupWire(app, engine, options.wire);
		configureViewEngine(app, engine, options);
		app.use((_req: unknown, res: unknown, next: () => void) => {
			attachResView(res, engine);
			next();
		});
		return engine;
	}

	// Middleware style: kireExpress(options) -> app.use(...).
	const options = appOrOptions as KireExpressOptions;
	const engine = buildEngine(options);
	const inlineWire = options.wire
		? prepareInlineWire(engine, options.wire)
		: null;
	let configured = false;

	const middleware = ((
		// biome-ignore lint/suspicious/noExplicitAny: Express req/res/next are external
		req: any,
		// biome-ignore lint/suspicious/noExplicitAny: Express req/res/next are external
		res: any,
		next: () => void,
	) => {
		if (!configured) {
			configureViewEngine(req.app, engine, options);
			configured = true;
		}
		attachResView(res, engine);
		if (inlineWire?.(req, res)) return;
		next();
	}) as KireExpressMiddleware;
	middleware.engine = engine;
	return middleware;
}

/** Load wire into the engine and return an inline request handler for its endpoints. */
// biome-ignore lint/suspicious/noExplicitAny: Wire objects are external
function prepareInlineWire(engine: Kire<boolean>, wire: any) {
	const wirePkg = requireWire("@kirejs/express");
	const wirePath = wire.path ?? "/_wire";
	const scriptUrl = wire.scriptUrl ?? "/kirewire.js";
	engine.plugin(
		wirePkg.kirewirePlugin(wire.instance, { scriptUrl, path: wirePath }),
	);
	const clientScript = resolveClientScript(wire);

	// Returns true when it handled the request (so the middleware stops).
	// biome-ignore lint/suspicious/noExplicitAny: Express req/res are external
	return (req: any, res: any): boolean => {
		if (req.method === "POST" && req.path === wirePath) {
			Promise.resolve(wirePkg.handleUpdate(wire.instance, req.body)).then(
				// biome-ignore lint/suspicious/noExplicitAny: HttpResult shape from @kirejs/wire
				(result: any) => res.status(result.status).json(result.body),
			);
			return true;
		}
		if (req.method === "GET" && req.path === scriptUrl && clientScript) {
			res.sendFile(clientScript);
			return true;
		}
		return false;
	};
}

// biome-ignore lint/suspicious/noExplicitAny: Express app + Wire objects are external
function setupWire(app: any, engine: Kire<boolean>, wire: any): void {
	const wirePkg = requireWire("@kirejs/express");
	const wirePath = wire.path ?? "/_wire";
	const scriptUrl = wire.scriptUrl ?? "/kirewire.js";

	engine.plugin(
		wirePkg.kirewirePlugin(wire.instance, { scriptUrl, path: wirePath }),
	);
	wirePkg.expressAdapter(app, wire.instance, {
		path: wirePath,
		store: wire.store,
	});

	const clientScript = resolveClientScript(wire);
	if (clientScript) {
		app.get(scriptUrl, (_req: unknown, res: any) => res.sendFile(clientScript));
	}
}

// biome-ignore lint/suspicious/noExplicitAny: optional dependency resolved at runtime
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
// biome-ignore lint/suspicious/noExplicitAny: Wire option object is external
function resolveClientScript(wire: any): string | null {
	if (wire.clientScript) return wire.clientScript;
	try {
		const nodePath = require("node:path");
		const { existsSync } = require("node:fs");
		const main = require.resolve("@kirejs/wire").replace(/\\/g, "/");
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
