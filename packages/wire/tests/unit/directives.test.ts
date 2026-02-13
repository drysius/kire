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

		const output = await kire.render("@wired");

		expect(output).toContain("<script src=\"/_custom_wire/kirewire.min.js\"></script>");
		expect(output).toContain("<link rel=\"stylesheet\" href=\"/_custom_wire/kirewire.min.css\">");
	});

	test("attributes schema should be registered", async () => {
		const kire = new Kire({ silent: true, directives:false });
        const { Wired } = await import("../../src/wired");
		kire.plugin(Wired.plugin, { route: "/_wire" });

		const schema = kire.pkgSchema("test-app");
		const attrs = schema.attributes;

		expect(attrs).toBeDefined();
		expect(attrs["wire:click"]).toBeDefined();
		expect(attrs["wire:model"]).toBeDefined();
		expect(attrs["wire:loading"]).toBeDefined();
	});
});
