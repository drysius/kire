import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Kire } from "../src/index";
import { md5 } from "../src/utils/md5";

describe("Kire Core - Caching & Require", () => {
	const testDir = resolve("./test-cache-env");

	beforeAll(async () => {
		await mkdir(testDir, { recursive: true });
	});

	afterAll(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	test("md5 utility should generate correct hash", () => {
		const hash = md5("hello world");
		expect(hash).toBe("5eb63bbbe01eeed093cb22bb8f5acdc3");
	});

	test("kire.compileFn should return an AsyncFunction", async () => {
		const kire = new Kire();
		const fn = await kire.compileFn("Hello {{ name }}");
		expect(fn).toBeInstanceOf(Function);
		expect(fn.constructor.name).toBe("AsyncFunction");
	});

	test("$ctx.require should cache compiled functions", async () => {
		const kire = new Kire({ production: true });
		kire.namespace("views", testDir);
		kire.$resolver = async (p) => await readFile(p, "utf-8");

		let callCount = 0;
		const originalResolver = kire.$resolver;
		kire.$resolver = async (path) => {
			callCount++;
			return await originalResolver(path);
		};

		await writeFile(join(testDir, "cache-test.kire"), "Cache Content");

		// First call
		const res1 = await kire.render("@include('views.cache-test')");
		expect(callCount).toBe(1);
		expect(res1).toBe("Cache Content");

		// Second call (should be cached)
		const res2 = await kire.render("@include('views.cache-test')");
		expect(callCount).toBe(1); // Should still be 1
		expect(res2).toBe(res1);
	});

	test("$ctx.require should recompile if content changes (non-prod)", async () => {
		const kire = new Kire({ production: false });
		kire.namespace("views", testDir);
		kire.$resolver = async (p) => await readFile(p, "utf-8");

		await writeFile(join(testDir, "dynamic.kire"), "Version 1");

		// First call
		const res1 = await kire.render("@include('views.dynamic')");
		expect(res1).toBe("Version 1");

		// Change content
		await writeFile(join(testDir, "dynamic.kire"), "Version 2");

		// Second call
		const res2 = await kire.render("@include('views.dynamic')");
		expect(res2).toBe("Version 2");

		expect(res1).not.toBe(res2);
	});

	test("$ctx.require should NOT recompile if content matches hash (non-prod optimization)", async () => {
		const kire = new Kire({ production: false });
		kire.namespace("views", testDir);
		kire.$resolver = async (p) => await readFile(p, "utf-8");

		await writeFile(join(testDir, "static.kire"), "Same Content");

		let resolverCalls = 0;
		const originalResolver = kire.$resolver;
		kire.$resolver = async (p) => {
			resolverCalls++;
			return await originalResolver(p);
		};

		// We mock compileFn to count compilations
		const originalCompileFn = kire.compileFn;
		let compileCalls = 0;
		kire.compileFn = async (c) => {
			compileCalls++;
			return originalCompileFn.call(kire, c);
		};

		await kire.render("@include('views.static')");
		expect(resolverCalls).toBe(1);
		expect(compileCalls).toBe(2); // 1 for main template, 1 for included file

		await kire.render("@include('views.static')");
		expect(resolverCalls).toBe(2); // Called resolver to check content
		expect(compileCalls).toBe(3); // Hash matched, so NO new compilation for include, but main template is compiled again
	});
});
