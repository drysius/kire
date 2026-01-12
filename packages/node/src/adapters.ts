import { readFile } from "node:fs/promises";
import { globToRegex, recursiveReaddir } from "./utils";

// These are global objects that may or may not exist depending on the runtime
declare const Bun: any;
declare const Deno: any;

export interface RuntimeAdapter {
	readFile(path: string): Promise<string>;
	readDir(pattern: string): Promise<string[]>;
}

export const NodeAdapter: RuntimeAdapter = {
	async readFile(path) {
		return await readFile(path, "utf-8");
	},
	async readDir(pattern) {
		// Assume glob is relative to CWD for now
		return await recursiveReaddir(".", globToRegex(pattern));
	},
};

export const BunAdapter: RuntimeAdapter = {
	async readFile(path) {
		if (typeof Bun === "undefined") throw new Error("Bun is not available");
		return await Bun.file(path).text();
	},
	async readDir(pattern) {
		if (typeof Bun === "undefined") throw new Error("Bun is not available");
		const glob = new Bun.Glob(pattern);
		const files: string[] = [];
		for await (const file of glob.scan(".")) {
			files.push(file);
		}
		return files;
	},
};

export const DenoAdapter: RuntimeAdapter = {
	async readFile(path) {
		if (typeof Deno === "undefined") throw new Error("Deno is not available");
		return await Deno.readTextFile(path);
	},
	async readDir(pattern) {
		if (typeof Deno === "undefined") throw new Error("Deno is not available");
		// Deno usually supports node builtins via compatibility layer,
		// so recursiveReaddir using 'node:fs' imports might work if polyfilled.
		// Otherwise we would need Deno.readDir logic.
		// Fallback to Node logic assuming compatibility.
		return await NodeAdapter.readDir(pattern);
	},
};
