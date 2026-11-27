import { readFileSync } from "node:fs";
import { Elysia } from "elysia";
import { Kire } from "kire";
import type { KireElysiaOptions } from "./types";

export * from "./types";

function buildEngine(options: KireElysiaOptions): Kire<boolean> {
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
 * Build an Elysia plugin that wires in Kire with almost no configuration:
 *
 * ```ts
 * import { Elysia } from "elysia";
 * import { kireElysia } from "@kirejs/elysia";
 *
 * const app = new Elysia()
 *   .use(kireElysia({ views: "resources/views" }))
 *   .get("/", ({ view }) => view("home", { title: "Hi" }))
 *   .get("/about", ({ view }) => view("pages.about"))
 *   .listen(3000);
 * ```
 *
 * Decorates the context with `view(name, data)` (renders a dotted view path to
 * an HTML `Response`) and `kire` (the engine), and optionally mounts Kirewire
 * endpoints + client runtime.
 */
export function kireElysia(options: KireElysiaOptions): Elysia {
	const engine = buildEngine(options);

	let app: any = new Elysia({ name: options.name ?? "kire" })
		.decorate("kire", engine)
		.decorate("view", (name: string, data: Record<string, unknown> = {}) =>
			Promise.resolve(engine.view(name, data)).then(htmlResponse),
		);

	if (options.wire) {
		let wirePkg: any;
		try {
			wirePkg = require("@kirejs/wire");
		} catch {
			throw new Error(
				"@kirejs/elysia: `wire` option requires `@kirejs/wire` to be installed.",
			);
		}
		const wire = options.wire;
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

		app = app.post(wirePath, async ({ body, set }: any) => {
			const result = await wirePkg.handleUpdate(wire.instance, body);
			set.status = result.status;
			return result.body;
		});

		if (ws) {
			const hub = ws.hub ?? new wirePkg.Hub();
			// Bridge Elysia's event-based ws lifecycle to serveWs's callback model:
			// stash each connection's registered handlers keyed by the raw socket.
			const conns = new Map<any, { msg?: (d: string) => void; close?: () => void }>();
			const key = (socket: any) => socket.raw ?? socket;
			app = app.ws(wsPath as string, {
				open(socket: any) {
					const h: { msg?: (d: string) => void; close?: () => void } = {};
					conns.set(key(socket), h);
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
						{ channel: ws.channel },
					);
				},
				message(socket: any, message: any) {
					const data =
						typeof message === "string" ? message : JSON.stringify(message);
					conns.get(key(socket))?.msg?.(data);
				},
				close(socket: any) {
					const k = key(socket);
					conns.get(k)?.close?.();
					conns.delete(k);
				},
			});
		}

		const clientScript = resolveClientScript(wire);
		if (clientScript) {
			app = app.get(
				scriptUrl,
				() =>
					new Response(readFileSync(clientScript), {
						headers: { "content-type": "text/javascript; charset=utf-8" },
					}),
			);
		}
	}

	return app as Elysia;
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
