import { readFileSync } from "node:fs";
import type { MiddlewareHandler } from "hono";
import { Kire } from "kire";
import type { KireHonoOptions } from "./types";

export * from "./types";

// Augment Hono's context variables so `c.var.view(...)` / `c.get("view")` are typed.
declare module "hono" {
	interface ContextVariableMap {
		/** Render a (dotted) Kire view path and send it as an HTML `Response`. */
		view: (
			name: string,
			data?: Record<string, unknown>,
		) => Response | Promise<Response>;
	}
}

function buildEngine(options: KireHonoOptions): Kire<boolean> {
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
 * Build a Hono middleware that wires in Kire with almost no configuration:
 *
 * ```ts
 * import { Hono } from "hono";
 * import { kireHono } from "@kirejs/hono";
 *
 * const app = new Hono();
 * app.use(kireHono({ views: "resources/views" }));
 * app.get("/", (c) => c.var.view("home", { title: "Hi" }));
 * app.get("/about", (c) => c.var.view("pages.about"));
 * ```
 *
 * Sets a `view(name, data)` context helper (renders a dotted view path to an
 * HTML `Response` via `c.html`) and optionally mounts the Kirewire update
 * endpoint and client runtime inline.
 */
export function kireHono(options: KireHonoOptions): MiddlewareHandler {
	const engine = buildEngine(options);

	let wirePkg: any;
	let wire: any;
	let wirePath = "";
	let scriptUrl = "";
	let clientScript: string | null = null;

	if (options.wire) {
		try {
			wirePkg = require("@kirejs/wire");
		} catch {
			throw new Error(
				"@kirejs/hono: `wire` option requires `@kirejs/wire` to be installed.",
			);
		}
		wire = options.wire;
		wirePath = wire.path ?? "/_wire";
		scriptUrl = wire.scriptUrl ?? "/kirewire.js";
		const ws = resolveWs(wire);
		const wsActive = ws ? attachNodeWs(wirePkg, wire.instance, ws) : false;
		engine.plugin(
			wirePkg.kirewirePlugin(wire.instance, {
				scriptUrl,
				path: wirePath,
				wsPath: wsActive ? ws!.path : undefined,
				channel: wsActive ? ws!.channel : undefined,
			}),
		);
		clientScript = resolveClientScript(wire);
	}

	return async (c, next) => {
		c.set("view", (name: string, data: Record<string, unknown> = {}) =>
			Promise.resolve(engine.view(name, data)).then((html) =>
				c.html(html as string),
			),
		);

		if (wire) {
			if (c.req.method === "POST" && c.req.path === wirePath) {
				const result = await wirePkg.handleUpdate(
					wire.instance,
					await c.req.text(),
				);
				return c.json(result.body, result.status);
			}
			if (c.req.method === "GET" && c.req.path === scriptUrl && clientScript) {
				return c.body(readFileSync(clientScript), 200, {
					"content-type": "text/javascript; charset=utf-8",
				});
			}
		}

		await next();
	};
}

/** Normalize `wire.ws` into concrete settings, or null when disabled. */
// biome-ignore lint/suspicious/noExplicitAny: Wire option object is external
function resolveWs(wire: any): {
	path: string;
	channel?: string;
	server?: any;
	hub?: any;
} | null {
	if (!wire.ws) return null;
	const ws = wire.ws === true ? {} : wire.ws;
	return {
		path: ws.path ?? "/_wire/ws",
		channel: ws.channel,
		server: ws.server,
		hub: ws.hub,
	};
}

/**
 * Attach the Kirewire WebSocket transport to a Node `http.Server` using the `ws`
 * package. Returns true when wired; false (with a warning) when no server was
 * given, so the caller leaves the client on HTTP.
 */
// biome-ignore lint/suspicious/noExplicitAny: Wire objects are external
function attachNodeWs(
	wirePkg: any,
	instance: any,
	ws: NonNullable<ReturnType<typeof resolveWs>>,
): boolean {
	if (!ws.server) {
		console.warn(
			"[@kirejs/hono] wire.ws is enabled but no `server` was provided; " +
				"pass the http.Server (e.g. from app.listen or http.createServer(app)). " +
				"Falling back to the HTTP transport.",
		);
		return false;
	}
	let WebSocketServer: any;
	try {
		({ WebSocketServer } = require("ws"));
	} catch {
		throw new Error(
			"@kirejs/hono: wire.ws requires the `ws` package to be installed.",
		);
	}
	const hub = ws.hub ?? new wirePkg.Hub();
	const wss = new WebSocketServer({ server: ws.server, path: ws.path });
	wss.on("connection", (socket: any) => {
		wirePkg.serveWs(
			instance,
			hub,
			{
				send: (data: string) => socket.send(data),
				onMessage: (cb: (d: string) => void) =>
					socket.on("message", (d: any) => cb(d.toString())),
				onClose: (cb: () => void) => socket.on("close", cb),
			},
			{ channel: ws.channel },
		);
	});
	return true;
}

/** Local file for the Kirewire client runtime: explicit, or the resolved bundle. */
// Wire option object is external.
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
