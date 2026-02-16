import type { Kire } from "kire";
import type { KireAsset } from "./types";

function getAssetFromPath(
	kire: Kire,
	path: string,
): { content: string; type: "js" | "css" | "mjs" | "svg" } | null {
	// Validate path and extract hash/type
	// Ensures path ends with /hash.ext to prevent directory traversal
	const match = path.match(/\/([a-f0-9]{8})\.(js|css|mjs|svg)$/);
	if (!match) return null;

	const hash = match[1];
	const ext = match[2] as "js" | "css" | "mjs" | "svg";

	const cache = kire.cached<KireAsset>("@kirejs/assets");
	const asset = cache[hash!];
	if (asset && asset.type === ext) {
		return { content: asset.content, type: ext };
	}
	return null;
}

function getContentType(type: "js" | "css" | "mjs" | "svg"): string {
	switch (type) {
		case "css":
			return "text/css";
		case "svg":
			return "image/svg+xml";
		case "mjs":
		case "js":
		default:
			return "application/javascript";
	}
}

export const createKireFS = (kire: Kire) => ({
	// Express middleware
	express: (req: any, res: any, next: any) => {
		const asset = getAssetFromPath(kire, req.path || req.url);
		if (asset) {
			res.setHeader("Content-Type", getContentType(asset.type));
			res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
			return res.send(asset.content);
		}
		next();
	},

	// Fastify handler
	fastify: async (req: any, reply: any) => {
		const asset = getAssetFromPath(kire, req.raw.url || req.url);
		if (asset) {
			reply.header("Content-Type", getContentType(asset.type));
			reply.header("Cache-Control", "public, max-age=31536000, immutable");
			return reply.send(asset.content);
		}
		// Fallback for Fastify route handler if not found
		return reply.code(404).send("Not Found");
	},

	// Hono middleware
	hono: async (c: any, next: any) => {
		const asset = getAssetFromPath(kire, c.req.path);
		if (asset) {
			c.header("Content-Type", getContentType(asset.type));
			c.header("Cache-Control", "public, max-age=31536000, immutable");
			return c.body(asset.content);
		}
		await next();
	},

	// Elysia handler
	elysia: (context: any) => {
		const asset = getAssetFromPath(kire, context.path);
		if (asset) {
			context.set.headers["Content-Type"] = getContentType(asset.type);
			context.set.headers["Cache-Control"] =
				"public, max-age=31536000, immutable";
			return asset.content;
		}
	},
});
