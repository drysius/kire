import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Kire } from "kire";
import type { SsgState } from "./types";

// Helper to get SSG state from Kire cache Map
export function getSsgState(kire: Kire): SsgState {
	const state = kire.cached<SsgState>("@kirejs/ssg").get("ROOT");
	if (!state)
		throw new Error(
			"SSG State not initialized in Kire cache. Make sure the plugin is loaded.",
		);
	return state;
}

// Helper to crawl
export async function getFiles(dir: string): Promise<string[]> {
	try {
		const dirents = await readdir(dir, { withFileTypes: true });
		const files = await Promise.all(
			dirents.map(async (dirent) => {
				const res = resolve(dir, dirent.name);
				if (dirent.isDirectory()) {
					return getFiles(res);
				} else {
					return res;
				}
			}),
		);
		return Array.prototype.concat(...files);
	} catch (_e) {
		return [];
	}
}

// Create a proxy to track file accesses
export function trackFileAccess(kire: Kire) {
	const originalCacheGet = kire.$files.get;
	const originalCacheSet = kire.$files.set;
	const originalCacheClear = kire.$files.clear;

	kire.$files.get = function (key: string) {
		const start = Date.now();
		const result = originalCacheGet.call(this, key);
		const duration = Date.now() - start;

		try {
			const state = getSsgState(kire);
			state.fileAccessHistory.push({
				file: key,
				timestamp: new Date(),
				type: "cache",
				duration,
			});

			if (
				state.currentRoute &&
				!state.routeCompilationChain.has(state.currentRoute)
			) {
				state.routeCompilationChain.set(state.currentRoute, []);
			}
			if (
				state.currentRoute &&
				!state.routeCompilationChain.get(state.currentRoute)?.includes(key)
			) {
				state.routeCompilationChain.get(state.currentRoute)?.push(key);
			}
		} catch (_e) {}

		return result;
	};

	kire.$files.set = function (key: string, value: any) {
		try {
			const state = getSsgState(kire);
			state.fileAccessHistory.push({
				file: key,
				timestamp: new Date(),
				type: "write",
			});
		} catch (_e) {}
		return originalCacheSet.call(this, key, value);
	};

	kire.$files.clear = function () {
		try {
			const state = getSsgState(kire);
			state.fileAccessHistory.length = 0;
			state.routeCompilationChain.clear();
		} catch (_e) {}
		return originalCacheClear.call(this);
	};

	// Track view compilation
	const originalView = kire.view.bind(kire);
	kire.view = async (template: string, data?: any) => {
		let state: SsgState | null = null;
		try {
			state = getSsgState(kire);
		} catch (_e) {}

		if (!state) return originalView(template, data);

		const prevRoute = state.currentRoute;
		state.currentRoute = template;
		const start = Date.now();

		try {
			state.fileAccessHistory.push({
				file: template,
				timestamp: new Date(),
				type: "compile",
			});

			state.routeCompilationChain.set(template, [template]);

			const result = await originalView(template, data);
			const duration = Date.now() - start;

			const lastEntry =
				state.fileAccessHistory[state.fileAccessHistory.length - 1];
			if (lastEntry && lastEntry.file === template) {
				lastEntry.duration = duration;
			}

			return result;
		} finally {
			state.currentRoute = prevRoute;
		}
	};
}
