import {
	createVanillaWireAdapter,
	type VanillaWireAdapterOptions,
} from "./vanilla";

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

function writeExpressResult(res: any, output: any) {
	const status = Number(output?.status || 200);
	const headers = (output?.headers || {}) as Record<string, string>;

	if (typeof res.status === "function") {
		res.status(status);
	} else {
		res.statusCode = status;
	}

	const headerEntries = Object.entries(headers);
	for (let i = 0; i < headerEntries.length; i++) {
		const [name, value] = headerEntries[i]!;
		if (typeof res.setHeader === "function") {
			res.setHeader(name, value as any);
		} else if (typeof res.set === "function") {
			res.set(name, value as any);
		}
	}

	const payload = output?.result;
	if (payload && typeof payload.pipe === "function") {
		payload.pipe(res);
		return;
	}

	if (typeof res.send === "function") {
		res.send(payload);
		return;
	}

	if (payload === undefined || payload === null) {
		res.end();
		return;
	}

	res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
}

export function ExpressPlugin(options: VanillaWireAdapterOptions) {
	const adapter = createVanillaWireAdapter(options);

	return async function kirewireExpressMiddleware(
		req: any,
		res: any,
		next?: (error?: any) => void,
	) {
		const rawUrl = String(req?.originalUrl || req?.url || "");
		const path = pathnameFromUrl(rawUrl);
		if (!path.startsWith(adapter.route)) {
			if (typeof next === "function") next();
			return;
		}

		try {
			const output = await adapter.handle({
				request: req,
				method: String(req?.method || "GET"),
				url: rawUrl,
				body: req?.body,
				signal: req?.signal,
			});
			writeExpressResult(res, output);
		} catch (error) {
			if (typeof next === "function") {
				next(error);
				return;
			}
			res.statusCode = 500;
			res.end(
				JSON.stringify({ error: String((error as any)?.message || error) }),
			);
		}
	};
}
