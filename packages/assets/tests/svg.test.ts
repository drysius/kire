import { describe, expect, it, mock, spyOn } from "bun:test";
import { Kire } from "kire";
import { createKireFS, KireAssets } from "../src/index";

describe("KireAssets SVG", () => {
	it("should load and cache remote SVG and render img tag", async () => {
		const mockFetch = spyOn(globalThis, "fetch").mockImplementation(
			async (url: string) => {
				if (url.toString().endsWith("icon.svg")) {
					return new Response("<svg>remote-icon</svg>", { status: 200 });
				}
				return new Response("Not Found", { status: 404 });
			},
		);

		const kire = new Kire({ silent: true }).plugin(KireAssets);

		const template = `@svg('https://example.com/icon.svg', { class: 'icon', alt: 'Remote Icon' })`;
		const result = await kire.render(template);

		expect(mockFetch).toHaveBeenCalled();

		// Should render img tag
		expect(result).toContain("<img src=");
		// Should point to cached asset
		expect(result).toMatch(/src="\/_kire\/[a-f0-9]{8}\.svg"/);
		// Should include attributes
		expect(result).toContain('class="icon"');
		expect(result).toContain('alt="Remote Icon"');

		mockFetch.mockRestore();
	});

	it("should load and cache local SVG via resolver", async () => {
		const kire = new Kire({ silent: true }).plugin(KireAssets);
        kire.$files[kire.resolvePath("./local.svg")] = "<svg>local-icon</svg>";

		const template = `@svg('./local.svg', { width: '24' })`;
		const result = await kire.render(template);

		expect(result).toMatch(/src="\/_kire\/[a-f0-9]{8}\.svg"/);
		expect(result).toContain('width="24"');
	});

	it("should serve SVG assets with correct content type", async () => {
		const kire = new Kire({ silent: true }).plugin(KireAssets);
        kire.$files[kire.resolvePath("./test.svg")] = "<svg>served-icon</svg>";

		// Render to cache the asset
		const html = await kire.render(`@svg('./test.svg')`);

		// Extract hash
		const match = html.match(/src="\/_kire\/([a-f0-9]+)\.svg"/);
		if (!match) throw new Error("SVG src not found");
		const hash = match[1];
		const path = `/_kire/${hash}.svg`;

		const kireFS = createKireFS(kire);

		// Test Express middleware
		const mockRes = {
			setHeader: mock((_k, _v) => {}),
			send: mock((body) => body),
		};
		const next = mock(() => {});

		kireFS.express({ path: path }, mockRes, next);

		expect(mockRes.setHeader).toHaveBeenCalledWith(
			"Content-Type",
			"image/svg+xml",
		);
		expect(mockRes.send).toHaveBeenCalledWith("<svg>served-icon</svg>");
	});

	it("should handle missing SVG gracefully", async () => {
		const kire = new Kire({ silent: true }).plugin(KireAssets);

		// Suppress console.warn for this test
		const originalWarn = console.warn;
		console.warn = () => {};

		const template = `@svg('./missing.svg')`;
		const result = await kire.render(template);

		console.warn = originalWarn;

		expect(result).toContain("<!-- SVG not found: ./missing.svg -->");
	});
});
