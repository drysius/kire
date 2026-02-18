import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { registerDirectives } from "../../src/core/directives";

describe("Wire Directives", () => {
	test("@wire directive should generate correct render logic", async () => {
		const kire = new Kire({ silent: true });
		registerDirectives(kire, { route: "/_wire" });

		const result = kire.compile("@wire('counter', { start: 5 })");
        const code = result.code;
		expect(code).toContain("const $w = $globals.Wired");
		expect(code).toContain("getComponentClass($name)");
		expect(code).toContain("new $c(this)");
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
		const kire = new Kire({ silent: true, emptykire:true });
        const { Wired } = await import("../../src/wired");
		kire.plugin(Wired.plugin, { route: "/_wire" });

		const schema = kire.$schema;
		const attrs = schema.attributes;

		expect(attrs).toBeDefined();
		expect(attrs.find(a => a.name === "wire:click")).toBeDefined();
		expect(attrs.find(a => a.name === "wire:model")).toBeDefined();
		expect(attrs.find(a => a.name === "wire:loading")).toBeDefined();
	});
});
