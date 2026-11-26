// Anchors `fastify` in the program so the module augmentation below resolves
// (both for consumers and the declaration build).
import type {} from "fastify";
import { Kire } from "kire";
import type { KireFastifyOptions } from "./types";

export * from "./types";

// Augment Fastify's reply so `reply.view(...)` is typed for consumers.
declare module "fastify" {
	interface FastifyReply {
		/** Render a (dotted) Kire view path and send it as HTML. */
		view(name: string, data?: Record<string, unknown>): Promise<this>;
	}
}

/** A Fastify plugin carrying the Kire engine it installs. */
export interface KireFastifyPlugin {
	// biome-ignore lint/suspicious/noExplicitAny: Fastify plugin signature is external
	(fastify: any, opts: unknown, done: () => void): void;
	engine: Kire<boolean>;
	// Skip Fastify's encapsulation so the `view` decorator is app-wide.
	[key: symbol]: unknown;
}

function buildEngine(options: KireFastifyOptions): Kire<boolean> {
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

// biome-ignore lint/suspicious/noExplicitAny: duck-typing a Fastify instance
function isFastify(value: any): boolean {
	return !!value && typeof value.decorateReply === "function";
}

// biome-ignore lint/suspicious/noExplicitAny: Fastify instance is external
function applySetup(
	app: any,
	engine: Kire<boolean>,
	options: KireFastifyOptions,
): void {
	if (options.wire) setupWire(app, engine, options.wire);

	if (!app.hasReplyDecorator?.("view")) {
		app.decorateReply(
			"view",
			// Regular function so `this` is the reply instance.
			// biome-ignore lint/suspicious/noExplicitAny: `this` is the Fastify reply
			async function (
				this: any,
				name: string,
				data: Record<string, unknown> = {},
			) {
				const html = await engine.view(name, data);
				this.type("text/html; charset=utf-8").send(html);
				return this;
			},
		);
	}
}

/**
 * Wire Kire into a Fastify instance. Two equivalent call styles:
 *
 * ```ts
 * // 1) plugin style (idiomatic Fastify)
 * app.register(kireFastify({ views: "resources/views" }));
 *
 * // 2) direct style — returns the engine
 * const engine = kireFastify(app, { views: "resources/views" });
 * ```
 *
 * Either way adds `reply.view(name, data)` (renders a dotted Kire view path and
 * sends HTML) and optional one-line Kirewire setup via the `wire` option.
 */
export function kireFastify(options: KireFastifyOptions): KireFastifyPlugin;
// biome-ignore lint/suspicious/noExplicitAny: Fastify instance is external
export function kireFastify(
	app: any,
	options: KireFastifyOptions,
): Kire<boolean>;
export function kireFastify(
	// biome-ignore lint/suspicious/noExplicitAny: overloaded first argument
	appOrOptions: any,
	maybeOptions?: KireFastifyOptions,
): Kire<boolean> | KireFastifyPlugin {
	// Direct style: kireFastify(app, options).
	if (isFastify(appOrOptions)) {
		const options = maybeOptions as KireFastifyOptions;
		const engine = buildEngine(options);
		applySetup(appOrOptions, engine, options);
		return engine;
	}

	// Plugin style: app.register(kireFastify(options)).
	const options = appOrOptions as KireFastifyOptions;
	const engine = buildEngine(options);
	const plugin = ((fastify: unknown, _opts: unknown, done: () => void) => {
		applySetup(fastify, engine, options);
		done();
	}) as KireFastifyPlugin;
	// Equivalent to fastify-plugin's behavior: apply decorators to the parent scope.
	plugin[Symbol.for("skip-override")] = true;
	plugin.engine = engine;
	return plugin;
}

// biome-ignore lint/suspicious/noExplicitAny: Fastify + Wire objects are external
function setupWire(app: any, engine: Kire<boolean>, wire: any): void {
	let wirePkg: any;
	try {
		wirePkg = require("@kirejs/wire");
	} catch {
		throw new Error(
			"@kirejs/fastify: `wire` option requires `@kirejs/wire` to be installed.",
		);
	}

	const wirePath = wire.path ?? "/_wire";
	const scriptUrl = wire.scriptUrl ?? "/kirewire.js";

	engine.plugin(
		wirePkg.kirewirePlugin(wire.instance, { scriptUrl, path: wirePath }),
	);

	app.post(wirePath, async (req: any, reply: any) => {
		const result = await wirePkg.handleUpdate(wire.instance, req.body);
		reply.status(result.status).send(result.body);
	});

	const clientScript = resolveClientScript(wire);
	if (clientScript) {
		const { readFileSync } = require("node:fs");
		app.get(scriptUrl, (_req: any, reply: any) => {
			reply
				.type("text/javascript; charset=utf-8")
				.send(readFileSync(clientScript, "utf8"));
		});
	}
}

/** Local file for the Kirewire client runtime: explicit, or the resolved bundle. */
// biome-ignore lint/suspicious/noExplicitAny: Wire option object is external
function resolveClientScript(wire: any): string | null {
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
