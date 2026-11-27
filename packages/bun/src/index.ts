import { Kire } from "kire";
import type { KireBun, KireBunOptions, WireIntegration } from "./types";

export * from "./types";

function buildEngine(options: KireBunOptions): Kire<boolean> {
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

function htmlResponse(html: string): Response {
	return new Response(html, {
		headers: { "content-type": "text/html; charset=utf-8" },
	});
}

/**
 * Wire Kire into a native `Bun.serve` app. Unlike the router integrations there
 * is no framework — you compose the returned pieces into your own `fetch`:
 *
 * ```ts
 * import { kireBun } from "@kirejs/bun";
 *
 * const kire = kireBun({ views: "views", wire: { instance: wire, ws: true } });
 *
 * Bun.serve({
 *   async fetch(req, server) {
 *     const res = await kire.wire(req, server);
 *     if (res !== null) return res; // wire route (or undefined on WS upgrade)
 *     const { pathname } = new URL(req.url);
 *     if (pathname === "/") return kire.view("home", { title: "Hi" });
 *     return new Response("Not Found", { status: 404 });
 *   },
 *   websocket: kire.websocket, // undefined unless wire.ws is enabled
 * });
 * ```
 *
 * `view(name, data)` renders a dotted view path to an HTML `Response`. When
 * `wire` is set, Kirewire is mounted and its client runtime is auto-served; Bun
 * owns its server, so `wire.ws` works directly when declared.
 */
export function kireBun(options: KireBunOptions): KireBun {
	const engine = buildEngine(options);

	const view = (name: string, data: Record<string, unknown> = {}) =>
		Promise.resolve(engine.view(name, data)).then(htmlResponse);

	const wire = options.wire;
	if (!wire) {
		return {
			engine,
			view,
			wire: async () => null,
		};
	}

	let wirePkg: any;
	try {
		wirePkg = require("@kirejs/wire");
	} catch {
		throw new Error(
			"@kirejs/bun: the `wire` option requires `@kirejs/wire` to be installed.",
		);
	}

	const wirePath = wire.path ?? "/_wire";
	const scriptUrl = wire.scriptUrl ?? "/kirewire.js";
	const ws = wire.ws ? (wire.ws === true ? {} : wire.ws) : null;
	const wsPath = ws ? (ws.path ?? "/_wire/ws") : undefined;

	engine.plugin(
		wirePkg.kirewirePlugin(wire.instance, {
			scriptUrl,
			path: wirePath,
			wsPath,
			channel: ws?.channel,
		}),
	);

	const clientScript = resolveClientScript(wire);

	// Bun native WebSocket handler: bridge its event lifecycle to serveWs's
	// callback model, keyed per connection.
	let websocket: any;
	if (ws) {
		const hub = ws.hub ?? new wirePkg.Hub();
		const conns = new WeakMap<
			object,
			{ msg?: (d: string) => void; close?: () => void }
		>();
		websocket = {
			open(socket: any) {
				const h: { msg?: (d: string) => void; close?: () => void } = {};
				conns.set(socket, h);
				wirePkg.serveWs(
					wire.instance,
					hub,
					{
						send: (data: string) => socket.send(data),
						onMessage: (cb: (d: string) => void) => {
							h.msg = cb;
						},
						onClose: (cb: () => void) => {
							h.close = cb;
						},
					},
					{ channel: socket.data?.channel ?? ws.channel },
				);
			},
			message(socket: any, message: any) {
				const data = typeof message === "string" ? message : message.toString();
				conns.get(socket)?.msg?.(data);
			},
			close(socket: any) {
				conns.get(socket)?.close?.();
				conns.delete(socket);
			},
		};
	}

	const handle = async (
		req: Request,
		server?: any,
	): Promise<Response | undefined | null> => {
		const url = new URL(req.url);

		if (wsPath && url.pathname === wsPath) {
			const upgraded = server?.upgrade(req, {
				data: { channel: ws?.channel },
			});
			return upgraded
				? undefined
				: new Response("Upgrade failed", {
						status: 426,
					});
		}

		if (req.method === "POST" && url.pathname === wirePath) {
			const result = await wirePkg.handleUpdate(
				wire.instance,
				await req.text(),
			);
			return Response.json(result.body, { status: result.status });
		}

		if (req.method === "GET" && url.pathname === scriptUrl && clientScript) {
			return new Response(Bun.file(clientScript), {
				headers: { "content-type": "text/javascript; charset=utf-8" },
			});
		}

		return null;
	};

	return { engine, view, wire: handle, websocket };
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
		const candidate = nodePath.join(pkgDir, "dist", "client", "auto.js");
		return existsSync(candidate) ? candidate : null;
	} catch {
		return null;
	}
}
