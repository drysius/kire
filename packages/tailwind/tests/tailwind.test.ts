import { describe, expect, it } from "bun:test";
import { Kire } from "kire";
// Import KireAssets from the sibling package source
import { KireAssets } from "../../assets/src/index";
import { KireTailwind } from "../src";

describe("@Kirejs/Tailwind", () => {
	it("should compile tailwind css using real compiler", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(KireTailwind);

		const tpl = `@tailwind().custom-class { color: red; }@end<div class="p-4 custom-class"></div>`;

		const result = await kire.render(tpl);

		// Check if inline style is generated (since assets plugin is not loaded)
		expect(result).toContain("<style>");
		expect(result).toContain(".custom-class");
		expect(result).toContain("color: red");
		// p-4 should generate padding: 1rem (or similar depending on v4 defaults)
		expect(result).toContain("padding: calc(var(--spacing) * 4)");
		expect(result).toContain("</style>");
	});

	it("should integrate with @kirejs/assets for deduplication and offloading", async () => {
		const kire = new Kire({ silent: true });
		// Load both plugins
		kire.plugin(KireTailwind);
		kire.plugin(KireAssets);

		const tpl = `@assets()@tailwind().shared-class { color: blue; }@end<div class="m-2 shared-class">Shared</div>`;

		// First Render
		const result1 = await kire.render(tpl);

		// Should NOT have inline style
		expect(result1).not.toContain("<style>.shared-class");

		// Should have link tag
		expect(result1).toContain('<link rel="stylesheet" href="/_kire/');
		expect(result1).toMatch(/\/([a-f0-9]{8})\.css"/);

		// Capture the hash
		const match1 = result1.match(/\/([a-f0-9]{8})\.css"/);
		const hash1 = match1 ? match1[1] : null;
		expect(hash1).toBeTruthy();

		// Verify cache content
		const cache = kire.cached("@kirejs/assets");
		expect(cache[hash1!]).toBeDefined();
		const asset = cache[hash1!];
		expect(asset.content).toContain(".shared-class");
		expect(asset.content).toContain("margin: calc(var(--spacing) * 2)"); // m-2

		// Second Render (Deduplication test)
		const result2 = await kire.render(tpl);
		const match2 = result2.match(/\/([a-f0-9]{8})\.css"/);
		const hash2 = match2 ? match2[1] : null;

		expect(hash2).toBe(hash1);

		// Cache size should still be 1 (deduplicated)
		expect(Object.keys(cache).length).toBe(1);
	});
});
