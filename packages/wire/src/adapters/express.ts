import type { Kire } from "kire";
import { type FileStore, handleUpload } from "../features/file-upload";
import type { Kirewire } from "../kirewire";
import { handleUpdate } from "../server/http";
import type { Hub } from "../server/hub";
import { SSE_HEADERS, serveSse } from "../server/sse";

export interface ExpressAdapterOptions {
	path?: string;
	uploadPath?: string;
	ssePath?: string;
	store?: FileStore;
	hub?: Hub;
	engineFactory?: () => Kire<boolean>;
}

/**
 * Register Kirewire routes on an Express-style app. Expects `express.json()` for
 * the update body and a multipart middleware (e.g. multer `.any()`) populating
 * `req.files` for uploads. Loosely typed to avoid an Express dependency.
 */
// biome-ignore lint/suspicious/noExplicitAny: framework objects are external
export function expressAdapter(
	app: any,
	kirewire: Kirewire,
	options: ExpressAdapterOptions = {},
) {
	const path = options.path ?? "/_wire";
	const uploadPath = options.uploadPath ?? "/_wire/upload";
	const ssePath = options.ssePath ?? "/_wire/sse";

	app.post(path, async (req: any, res: any) => {
		const result = await handleUpdate(
			kirewire,
			req.body,
			options.engineFactory?.(),
		);
		res.status(result.status).json(result.body);
	});

	if (options.store) {
		const store = options.store;
		app.post(uploadPath, async (req: any, res: any) => {
			const files = (req.files ?? []).map((f: any) => ({
				name: f.originalname ?? f.name,
				type: f.mimetype ?? f.type,
				data: f.buffer ?? f.data,
			}));
			res.json({ files: await handleUpload(store, files) });
		});
	}

	if (options.hub) {
		const hub = options.hub;
		app.get(ssePath, (req: any, res: any) => {
			res.writeHead(200, SSE_HEADERS);
			const unsubscribe = serveSse(hub, String(req.query?.channel ?? ""), {
				write: (frame) => res.write(frame),
				onClose: (cb) => req.on("close", cb),
			});
			req.on("close", unsubscribe);
		});
	}
}
