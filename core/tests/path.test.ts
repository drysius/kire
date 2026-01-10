import { expect, test } from "bun:test";
import { Kire } from "../src/index";

test("Kire - Path Resolution and Namespaces", async () => {
	const kire = new Kire();

	// Simulate root behavior or base namespace
	kire.namespace("~", "/app/views");
	kire.namespace("@components", "/app/components");

	// Test namespace resolution
	expect(kire.resolvePath("~/header")).toBe("/app/views/header.kire");

	// Test alias-like namespace resolution
	expect(kire.resolvePath("@components/Button")).toBe(
		"/app/components/Button.kire",
	);
	expect(kire.resolvePath("~/layout/Main")).toBe("/app/views/layout/Main.kire");

	// Test absolute path (should remain absolute)
	expect(kire.resolvePath("/absolute/path/file")).toBe(
		"/absolute/path/file.kire",
	);
});

test("Kire - Resolver in Directive", async () => {
	const kire = new Kire();
	// Setup namespace
	kire.namespace("~", "/home");

	kire.directive({
		name: "path",
		params: ["p:string"],
		onCall(ctx) {
			const resolved = kire.resolvePath(ctx.param("p"));
			ctx.raw(`$ctx.res("${resolved}");`);
		},
	});

	const result = await kire.render("@path('~/index')");
	expect(result).toBe("/home/index.kire");
});

test("Kire - File Resolver Integration (Mock)", async () => {
	const kire = new Kire({
		resolver: async (filename) => {
			if (filename === "/views/partial.kire") {
				return "Partial Content";
			}
			throw new Error(`File not found: ${filename}`);
		},
	});

	kire.namespace("views", "/views");

	// render('views.partial') -> resolves to /views/partial.kire -> calls resolver
	const result = await kire.view("views.partial");
	expect(result).toBe("Partial Content");
});
