import { describe, expect, it } from "bun:test";
import { Kire } from "kire";
import { KireAssets } from "../../assets/src/index";
import { KireTailwind } from "../src";
import { extractCandidates } from "../src/compiler";

const styleOf = (html: string) => html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";

describe("@kirejs/tailwind", () => {
	it("generates utility CSS for classes used anywhere in the page", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(KireTailwind);
		const tpl = `<head><tailwind></tailwind></head><div class="flex items-center gap-4 p-6">x</div>`;
		const css = styleOf(await kire.render(tpl));
		expect(css).toContain(".flex");
		expect(css).toContain(".items-center");
		expect(css).toContain(".gap-4");
		expect(css).toContain(".p-6");
	});

	it("keeps custom CSS in the block and compiles utilities together", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(KireTailwind);
		const tpl = `<tailwind>.custom { color: red; }</tailwind><div class="p-4 custom"></div>`;
		const result = await kire.render(tpl);
		const css = styleOf(result);
		expect(result).toContain("<style>");
		expect(css).toContain(".custom");
		expect(css).toContain("color: red");
		expect(css).toContain("padding");
		expect(result).not.toContain("KIRE_TW");
	});

	it("offloads to @kirejs/assets when present (no inline style, dedup)", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(KireTailwind);
		kire.plugin(KireAssets);
		const tpl = `@assets()<head><tailwind>.shared { color: blue; }</tailwind></head><div class="m-2 shared">S</div>`;

		const result1 = await kire.render(tpl);
		expect(result1).not.toContain("<style>.shared");
		expect(result1).toMatch(/\/([a-f0-9]{8})\.css"/);

		const hash1 = result1.match(/\/([a-f0-9]{8})\.css"/)?.[1];
		expect(hash1).toBeTruthy();
		const assetCache = kire.cached("@kirejs/assets") as Record<string, { content: string }>;
		expect(assetCache[hash1!]!.content).toContain(".shared");
		expect(assetCache[hash1!]!.content).toContain("margin");

		const result2 = await kire.render(tpl);
		expect(result2.match(/\/([a-f0-9]{8})\.css"/)?.[1]).toBe(hash1);
	});

	it("caches compilation across identical renders", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(KireTailwind);
		const original = (kire as any).compileCSSWithTailwind;
		let calls = 0;
		(kire as any).compileCSSWithTailwind = async (...a: any[]) => { calls++; return original(...a); };
		const tpl = `<tailwind></tailwind><div class="p-3"></div>`;
		await kire.render(tpl);
		await kire.render(tpl);
		expect(calls).toBe(1);
	});

	it("extractCandidates pulls classes from class attributes", () => {
		const html = `<div class="flex p-4"><span class='text-sm hover:underline'>x</span></div>`;
		expect(extractCandidates(html).sort()).toEqual(["flex", "hover:underline", "p-4", "text-sm"]);
	});
});
