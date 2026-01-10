import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { rm, writeFile } from "node:fs/promises";
import { Kire } from "kire";
import KireNode from "../src/index";

// Mock fetch for 'fetch' adapter
const _originalFetch = global.fetch;
// @ts-expect-error
global.fetch = mock(async (url: string) => {
	if (url === "http://example.com/template") {
		return {
			ok: true,
			statusText: "OK",
			text: async () => "Hello from Fetch!",
		};
	}
	return { ok: false, statusText: "Not Found" };
});

describe("@kirejs/node", () => {
	beforeAll(async () => {
		await writeFile("node-template.kire", "Hello from Node!");
		await writeFile("template.kire", "<div> Hello </div>");
	});

	afterAll(async () => {
		// Clean up files
		await rm("node-template.kire").catch(() => {});
		await rm("template.kire").catch(() => {});
		global.fetch = _originalFetch;
	});

	test("should use 'node' adapter by default", async () => {
		const kire = new Kire();
		kire.plugin(KireNode);
		// Use view() for file resolution
		const content = await kire.view("node-template.kire");
		expect(content).toBe("Hello from Node!");
	});

	test("should use 'bun' adapter when specified and Bun is available", async () => {
		if (typeof Bun === "undefined") {
			console.warn("Skipping Bun adapter test: Bun runtime not available.");
			return;
		}

		// Use the real file we created
		const kire = new Kire();
		kire.plugin(KireNode, { adapter: "bun" });

		// Pass the filename without the extension; Kire will resolve it
		const content = await kire.view("template");
		expect(content).toBe("<div> Hello </div>");
	});

	test("should throw error for 'deno' adapter when Deno is not available", async () => {
		const kire = new Kire();
		kire.plugin(KireNode, { adapter: "deno" });
		// Use view() to trigger resolver
		await expect(kire.view("template.kire")).rejects.toThrow(
			"Deno runtime is not available.",
		);
	});

	test("should use 'fetch' adapter for URLs", async () => {
		const kire = new Kire();
		kire.plugin(KireNode, { adapter: "fetch" });
		// Use view() for URL resolution
		const content = await kire.view("http://example.com/template");
		expect(content).toBe("Hello from Fetch!");
		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledWith("http://example.com/template");
	});

	test("kire.view() should be able to resolve paths via resolver plugin", async () => {
		const kire = new Kire();
		kire.plugin(KireNode);

		const content = await kire.view("node-template.kire", { name: "World" });
		expect(content).toBe("Hello from Node!");
	});

	test("should register $md5 helper using node crypto", async () => {
		const kire = new Kire();
		kire.plugin(KireNode);

		// "hello" md5 is 5d41402abc4b2a76b9719d911017c592
		const result = await kire.run(async ($ctx: any) => {
			const hash = $ctx.$md5("hello");
			$ctx.res(hash);
			return $ctx;
		}, {});
		expect(result).toBe("5d41402abc4b2a76b9719d911017c592");
	});
});
