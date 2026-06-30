import type { Kire } from "kire";
import { type FileStore, handleUpload } from "../features/file-upload";
import type { Kirewire } from "../kirewire";
import { handleUpdate } from "../server/http";
import type { Hub } from "../server/hub";
import { SSE_HEADERS, serveSse } from "../server/sse";

export interface FetchAdapterOptions {
	/** Update endpoint path. */
	path?: string;
	/** Upload endpoint path (requires `store`). */
	uploadPath?: string;
	/** SSE channel endpoint path (requires `hub`). */
	ssePath?: string;
	store?: FileStore;
	hub?: Hub;
	/** Per-request Kire fork factory used to render component views. */
	engineFactory?: () => Kire<boolean>;
}

/**
 * A Web-standard `(Request) => Promise<Response>` handler — works under Bun,
 * Deno, Cloudflare Workers, Hono, Elysia, and Node 18+ `fetch`. Serves the
 * update endpoint, optional multipart upload endpoint, and optional SSE channel.
 */
export function createFetchHandler(
	kirewire: Kirewire,
	options: FetchAdapterOptions = {},
) {
	const path = options.path ?? "/_wire";
	const uploadPath = options.uploadPath ?? "/_wire/upload";
	const ssePath = options.ssePath ?? "/_wire/sse";

	return async (request: Request): Promise<Response> => {
		const url = new URL(request.url);

		if (request.method === "POST" && url.pathname === path) {
			const body = await request.text();
			const result = await handleUpdate(
				kirewire,
				body,
				options.engineFactory?.(),
			);
			return Response.json(result.body, { status: result.status });
		}

		if (
			request.method === "POST" &&
			url.pathname === uploadPath &&
			options.store
		) {
			const form = await request.formData();
			const files = [];
			for (const value of form.values()) {
				if (typeof value === "string") continue;
				const file = value as File;
				files.push({
					name: file.name,
					type: file.type,
					data: new Uint8Array(await file.arrayBuffer()),
				});
			}
			const refs = await handleUpload(options.store, files);
			return Response.json({ files: refs });
		}

		if (request.method === "GET" && url.pathname === ssePath && options.hub) {
			const channel = url.searchParams.get("channel") ?? "";
			const hub = options.hub;
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				start(controller) {
					const unsubscribe = serveSse(hub, channel, {
						write: (frame) => controller.enqueue(encoder.encode(frame)),
						onClose: () => {},
					});
					request.signal?.addEventListener("abort", () => {
						unsubscribe();
						controller.close();
					});
				},
			});
			return new Response(stream, { headers: { ...SSE_HEADERS } });
		}

		return new Response("Not found", { status: 404 });
	};
}
