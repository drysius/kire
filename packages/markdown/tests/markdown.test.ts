import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { unlink, writeFile } from "node:fs/promises";
import { Kire } from "kire";
import { KireMarkdown } from "../src/index";

const TEMP_MD = "temp_test.md";
const TEMP_MD_CONTENT = "# Hello File\n\nThis is a file test.";

describe("KireMarkdown", () => {
	beforeAll(async () => {
		await writeFile(TEMP_MD, TEMP_MD_CONTENT);
	});

	afterAll(async () => {
		try {
			await unlink(TEMP_MD);
		} catch {} // Ignore errors during cleanup
	});

	it("should render markdown string", async () => {
		const kire = new Kire({ plugins: [KireMarkdown] });
		const tpl = `@markdown('# Hello World')`;
		const result = await kire.render(tpl);
		expect(result).toContain("<h1>Hello World</h1>");
	});

	it("should render markdown from file", async () => {
		const kire = new Kire({
			plugins: [KireMarkdown],
			resolver: async (path) => {
				if (path.includes(TEMP_MD)) {
					return TEMP_MD_CONTENT;
				}
				throw new Error(`File not found: ${path}`);
			},
		});

		const tpl = `@markdown('${TEMP_MD}')`;
		const result = await kire.render(tpl);
		expect(result).toContain("<h1>Hello File</h1>");
		expect(result).toContain("<p>This is a file test.</p>");
	});

	it("should render markdown with dynamic locals (mdview)", async () => {
		const kire = new Kire({
			plugins: [KireMarkdown],
			resolver: async (path) => {
				if (path.includes("dynamic.md")) {
					return "# Hello {{ it.name }}";
				}
				throw new Error("Not found");
			},
		});

		const html = await kire.view("dynamic.md", { name: "Kire" });
		expect(html).toContain("<h1>Hello Kire</h1>");

		// Test reactivity/different locals (cache check)
		const html2 = await kire.view("dynamic.md", { name: "World" });
		expect(html2).toContain("<h1>Hello World</h1>");
	});

	it("should render wildcard content (glob pattern)", async () => {
		const kire = new Kire({ plugins: [KireMarkdown] });

		// Mock $readdir
		kire.$readdir = async (pattern) => {
			if (pattern === "content/*.md") return ["file1.md", "file2.md"];
			return [];
		};

		// Mock $mdrender to avoid file reading
		kire.$ctx("$mdrender", async (src: string) => {
			if (src === "file1.md") return "<h1>File 1</h1>";
			if (src === "file2.md") return "<h1>File 2</h1>";
			return "";
		});

		const tpl = `@markdown('content/*.md')`;
		const result = await kire.render(tpl);

		expect(result).toContain("<h1>File 1</h1>");
		expect(result).toContain("<h1>File 2</h1>");
	});

	it("should expose kire.mdrender helper", async () => {
		const kire = new Kire({ plugins: [KireMarkdown] });
		expect(kire.mdrender).toBeDefined();
		if (kire.mdrender) {
			const html = await kire.mdrender("**Bold**");
			expect(html).toContain("<strong>Bold</strong>");
		}
	});

	it("should render kire components inside markdown", async () => {
		const kire = new Kire({ plugins: [KireMarkdown] });
		const html = await kire.mdrender("Hello {{ 123 }}");
		expect(html).toContain("Hello 123");

		const html2 = await kire.mdrender("Content: @if(true)Yes@end");
		expect(html2).toContain("Content: Yes");
	});

	it("should handle missing file gracefully (fallback to string)", async () => {
		const kire = new Kire({ plugins: [KireMarkdown] });
		const tpl = `@markdown('missing_file.md')`;
		const result = await kire.render(tpl);
		expect(result).toContain("<p>missing_file.md</p>");
	});
});
