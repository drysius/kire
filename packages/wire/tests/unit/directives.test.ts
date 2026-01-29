import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { registerDirectives } from "../../src/core/directives";

describe("Wire Directives", () => {
	test("@wire directive should generate correct render logic", async () => {
		const kire = new Kire({ silent: true });
		registerDirectives(kire, { route: "/_wire" });

		const code = await kire.compile("@wire('counter', { start: 5 })");
		expect(code).toContain("const $w = $ctx.$wire");
		expect(code).toContain("getComponentClass($name)");
		expect(code).toContain("new $c($ctx.$kire)");
		expect(code).toContain("$i.mount($params)");
		expect(code).toContain("wire:snapshot");
		expect(code).toContain(`'" wire:component="' + $name + '"'`);
	});

	test("@wired (scripts) should inject client script", async () => {
		const kire = new Kire({ silent: true });
		registerDirectives(kire, { route: "/_custom_wire" });

		// Mock resolver to avoid FS check in tests if possible,
		// but getClientScript uses fs.existsSync.
		// We rely on the fact that we are in the monorepo and paths usually resolve.

		const output = await kire.render("@wired");

		expect(output).toContain("<script>");
		expect(output).toContain("window.Alpine"); // Checks if script content is somewhat there
		expect(output).toContain("<style>");
		// Note: The actual script content depends on the build, but the tag structure is static
	});

	test("attributes schema should be registered", () => {
		const kire = new Kire({ silent: true });
		registerDirectives(kire, { route: "/_wire" });

		const schema = kire.pkgSchema("test-app");
		const attrs = schema.attributes?.global;

		expect(attrs).toBeDefined();
		expect(attrs["wire:click"]).toBeDefined();
		expect(attrs["wire:model"]).toBeDefined();
		expect(attrs["wire:loading"]).toBeDefined();
	});
});
