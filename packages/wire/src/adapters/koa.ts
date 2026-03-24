import { createVanillaWireAdapter, type VanillaWireAdapterOptions } from "./vanilla";

function pathnameFromUrl(rawUrl: string): string {
	try {
		return new URL(rawUrl, "http://localhost").pathname;
	} catch {
		const raw = String(rawUrl || "").trim();
		if (!raw) return "/";
		const idx = raw.indexOf("?");
		return idx >= 0 ? raw.slice(0, idx) || "/" : raw;
	}
}

export function KoaPlugin(options: VanillaWireAdapterOptions) {
	const adapter = createVanillaWireAdapter(options);

	return async function kirewireKoaMiddleware(ctx: any, next: () => Promise<any>) {
		const rawUrl = String(ctx?.originalUrl || ctx?.url || "");
		const path = pathnameFromUrl(rawUrl);
		if (!path.startsWith(adapter.route)) {
			await next();
			return;
		}

		const output = await adapter.handle({
			request: ctx?.request || ctx,
			method: String(ctx?.method || "GET"),
			url: rawUrl,
			body: ctx?.request?.body,
			signal: ctx?.req?.signal,
		});

		ctx.status = Number(output?.status || 200);
		const headers = (output?.headers || {}) as Record<string, string>;
		for (const [name, value] of Object.entries(headers)) {
			ctx.set(name, value as any);
		}
		ctx.body = output?.result;
	};
}

export { KoaPlugin as KoaAdapter };
