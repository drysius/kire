import { expect, test } from "bun:test";
import { Kire } from "../src/index";

test("Kire Schematics - Should register global attributes", () => {
	const kire = new Kire({ silent: true });

	kire.schematic("attributes.global", {
		"wire:click": {
			type: "string",
			comment: "Handles click events",
		},
	});

	const schema = kire.pkgSchema("test-pkg");

	expect(schema.attributes).toBeDefined();
	expect(schema.attributes!.global).toBeDefined();
	expect(schema.attributes!.global!["wire:click"]).toBeDefined();
	expect((schema.attributes!.global!["wire:click"] as any).type).toBe("string");
});
