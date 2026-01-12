import {
	BunAdapter,
	DenoAdapter,
	NodeAdapter,
	type RuntimeAdapter,
} from "./adapters";
import type { NodePluginOptions } from "./types";
import { fetchFile } from "./utils";

/**
 * Creates a file resolver function.
 */
export function createResolver(options: NodePluginOptions = {}) {
	const adapterName = options.adapter ?? "node";
	let adapter: RuntimeAdapter;

	switch (adapterName) {
		case "bun":
			adapter = BunAdapter;
			break;
		case "deno":
			adapter = DenoAdapter;
			break;
		case "fetch":
			// fetch adapter is a special case that only handles URLs
			adapter = {
				readFile: () => Promise.reject(new Error("Use fetch only for URLs")),
				readDir: () => Promise.resolve([]),
			};
			break;
		default:
			adapter = NodeAdapter;
			break;
	}

	return async (path: string): Promise<string> => {
		if (
			adapterName === "fetch" ||
			path.startsWith("http://") ||
			path.startsWith("https://")
		) {
			return await fetchFile(path);
		}

		try {
			return await adapter.readFile(path);
		} catch (e: any) {
			throw new Error(
				`[${adapterName}] Failed to read '${path}': ${e.message}`,
			);
		}
	};
}

/**
 * Creates a directory reader function.
 */
export function createReadDir(options: NodePluginOptions = {}) {
	const adapterName = options.adapter ?? "node";
	let adapter: RuntimeAdapter;

	switch (adapterName) {
		case "bun":
			adapter = BunAdapter;
			break;
		case "deno":
			adapter = DenoAdapter;
			break;
		default:
			adapter = NodeAdapter;
			break;
	}

	return async (pattern: string): Promise<string[]> => {
		try {
			return await adapter.readDir(pattern);
		} catch (e) {
			console.warn(`[${adapterName}] ReadDir failed:`, e);
			return [];
		}
	};
}
