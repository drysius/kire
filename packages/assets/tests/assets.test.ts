import { describe, expect, it, mock } from "bun:test";
import { Kire } from "kire";
import { createKireFS, KireAssets } from "../src/index";

describe("KireAssets", () => {
	it("should remove script and style tags and replace with placeholders", async () => {
		const kire = new Kire({
			plugins: [[KireAssets, { prefix: "_assets" }]],
		});

		const template = `
      <html>
        <head>
          @assets()
          <style>body { color: red; }</style>
        </head>
        <body>
          <h1>Hello</h1>
          <script>console.log('test');</script>
        </body>
      </html>
    `;

		const result = await kire.render(template);

		// Should not contain original script/style content
		expect(result).not.toContain("body { color: red; }");
		expect(result).not.toContain("console.log('test');");

		// Should contain links
		expect(result).toContain('<link rel="stylesheet" href="/_assets/');
		expect(result).toContain('<script src="/_assets/');
	});

	it("should ignore script and style tags with nocache attribute", async () => {
		const kire = new Kire({
			plugins: [[KireAssets, { prefix: "_assets" }]],
		});

		const template = `
      <html>
        <head>
          @assets()
          <style nocache>
            .dynamic { color: {{ color }}; }
          </style>
        </head>
        <body>
          <script nocache>
            const user = "{{ name }}";
          </script>
        </body>
      </html>
    `;

		const result = await kire.render(template, { color: "blue", name: "John" });

		// Should contain interpolated content
		expect(result).toContain(".dynamic { color: blue; }");
		expect(result).toContain('const user = "John";');

		// Should NOT contain links (assets should be empty)
		expect(result).not.toContain('<link rel="stylesheet"');
		expect(result).not.toContain('<script src="/_assets/');

		// Should contain the original tags
		// Note: The Kire parser might strip/normalize attributes depending on implementation
		// but the content should definitely be there inline.
		// The current implementation of Kire element directives replaces the WHOLE element if matched.
		// Since we return early in onCall, the element should remain touched only by standard compilation?
		// Actually, if element handler returns without doing anything, the element is output as is by Kire runtime?
		// Let's verify Kire core behavior.
		// If onCall returns, the element is output normally.

		// Check if tags are present
		expect(result).toContain("<style nocache>");
		expect(result).toContain("<script nocache>");
	});

	it("should serve assets via KireFS middleware", async () => {
		const kire = new Kire({
			plugins: [KireAssets],
		});

		// Render first to populate cache
		const html = await kire.render(`
        @assets()
        <script>var x = 1;</script>
        <style>.test { color: blue; }</style>
    `);

		// Extract hash from html to test middleware
		const scriptMatch = html.match(/src="\/_kire\/([a-f0-9]+)\.js"/);
		const styleMatch = html.match(/href="\/_kire\/([a-f0-9]+)\.css"/);

		if (!scriptMatch || !styleMatch) {
			throw new Error("Could not find injected assets in HTML");
		}

		const scriptHash = scriptMatch[1];
		const styleHash = styleMatch[1];
		const scriptPath = `/_kire/${scriptHash}.js`;
		const stylePath = `/_kire/${styleHash}.css`;

		const kireFS = createKireFS(kire);

		// --- Test Express ---
		{
			const mockRes = {
				setHeader: mock((_k, _v) => {}),
				send: mock((body) => body),
			};
			const next = mock(() => {});

			kireFS.express({ path: scriptPath }, mockRes, next);
			expect(mockRes.setHeader).toHaveBeenCalledWith(
				"Content-Type",
				"application/javascript",
			);
			expect(mockRes.send).toHaveBeenCalledWith("var x = 1;");
		}

		// --- Test Fastify ---
		{
			const mockReply = {
				header: mock((_k, _v) => {}),
				send: mock((body) => body),
				code: mock((_c) => mockReply),
			};

			await kireFS.fastify(
				{ url: scriptPath, raw: { url: scriptPath } },
				mockReply,
			);
			expect(mockReply.header).toHaveBeenCalledWith(
				"Content-Type",
				"application/javascript",
			);
			expect(mockReply.send).toHaveBeenCalledWith("var x = 1;");

			// Test Not Found
			const notFoundReply = {
				header: mock(() => {}),
				send: mock((b) => b),
				code: mock((_c) => notFoundReply),
			};
			await kireFS.fastify(
				{ url: "/bad.js", raw: { url: "/bad.js" } },
				notFoundReply,
			);
			expect(notFoundReply.code).toHaveBeenCalledWith(404);
		}

		// --- Test Hono ---
		{
			const mockC = {
				req: { path: stylePath },
				header: mock((_k, _v) => {}),
				body: mock((b) => b),
			};
			const next = mock(async () => {});

			await kireFS.hono(mockC, next);
			expect(mockC.header).toHaveBeenCalledWith("Content-Type", "text/css");
			expect(mockC.body).toHaveBeenCalledWith(".test { color: blue; }");

			// Test pass-through
			const mockC2 = { req: { path: "/other" } };
			await kireFS.hono(mockC2, next);
			expect(next).toHaveBeenCalled();
		}

		// --- Test Elysia ---
		{
			const mockContext = {
				path: scriptPath,
				set: { headers: {} as Record<string, string> },
			};

			const result = kireFS.elysia(mockContext);
			expect(mockContext.set.headers["Content-Type"]).toBe(
				"application/javascript",
			);
			expect(result).toBe("var x = 1;");
		}
	});
});
