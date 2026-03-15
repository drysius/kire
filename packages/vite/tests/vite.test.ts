import { afterEach, describe, expect, it } from "bun:test";
import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Kire } from "kire";
import kireVite, { KireVite, renderViteTags } from "../src";

function normalizePath(value: string): string {
	return value.replace(/\\/g, "/");
}

function createTempDir(): string {
	return mkdtempSync(path.join(os.tmpdir(), "kire-vite-"));
}

function createMockWatcher() {
	const handlers = new Map<string, Set<(file: string) => void>>();
	return {
		on(event: string, callback: (file: string) => void) {
			if (!handlers.has(event)) handlers.set(event, new Set());
			handlers.get(event)!.add(callback);
		},
		off(event: string, callback: (file: string) => void) {
			handlers.get(event)?.delete(callback);
		},
		emit(event: string, file: string) {
			for (const handler of handlers.get(event) || []) {
				handler(file);
			}
		},
	};
}

describe("@kirejs/vite", () => {
	const cleanupTargets: string[] = [];

	afterEach(() => {
		for (const target of cleanupTargets.splice(0, cleanupTargets.length)) {
			rmSync(target, { recursive: true, force: true });
		}
	});

	it("should configure build output and manifest like laravel-vite-plugin", () => {
		const root = createTempDir();
		cleanupTargets.push(root);

		const plugin = kireVite({
			publicDirectory: "public",
			buildDirectory: "themes/phoenix",
			input: ["./css/app.css", "js/app.js"],
		});

		const merged = plugin.config?.(
			{ root, build: {} },
			{ command: "build", mode: "production" },
		) as any;

		expect(normalizePath(merged.build.outDir)).toBe(
			normalizePath(path.join(root, "public", "themes", "phoenix")),
		);
		expect(merged.build.manifest).toBe("manifest.json");
		expect(merged.build.rollupOptions.input).toEqual([
			"css/app.css",
			"js/app.js",
		]);
	});

	it("should write and cleanup hot file in dev server mode", async () => {
		const root = createTempDir();
		cleanupTargets.push(root);

		const plugin = kireVite({
			publicDirectory: "public",
			buildDirectory: "themes/phoenix",
		});

		plugin.config?.({ root }, { command: "serve", mode: "development" });
		plugin.configResolved?.({ root, server: {} } as any);

		const watcher = createMockWatcher();
		const bus = new EventEmitter();
		(bus as any).address = () => ({ port: 5173 });

		const payloads: any[] = [];
		const cleanup = (await plugin.configureServer?.({
			ws: { send(payload: any) { payloads.push(payload); } },
			watcher,
			httpServer: bus as any,
			resolvedUrls: { local: ["http://127.0.0.1:5173/"], network: [] },
		} as any)) as (() => void) | undefined;

		bus.emit("listening");
		const hotFile = path.join(root, "public", "hot");
		expect(existsSync(hotFile)).toBe(true);
		expect(readFileSync(hotFile, "utf8")).toBe("http://127.0.0.1:5173");
		expect(payloads.length).toBe(0);

		cleanup?.();
		expect(existsSync(hotFile)).toBe(false);
	});

	it("should full-reload when .kire file changes", () => {
		const plugin = kireVite();
		const sent: any[] = [];

		plugin.handleHotUpdate?.({
			file: "/app/views/home.kire",
			server: {
				ws: { send(payload: any) { sent.push(payload); } },
				watcher: createMockWatcher(),
			},
		} as any);

		expect(sent).toHaveLength(1);
		expect(sent[0]).toEqual({ type: "full-reload", path: "*" });
	});

	it("should render production tags from manifest", () => {
		const root = createTempDir();
		cleanupTargets.push(root);

		const outputDir = path.join(root, "public", "themes", "phoenix");
		mkdirSync(outputDir, { recursive: true });
		writeFileSync(
			path.join(outputDir, "manifest.json"),
			JSON.stringify(
				{
					"css/app.css": {
						file: "assets/app-a1b2.css",
						src: "css/app.css",
						isEntry: true,
					},
					"js/app.js": {
						file: "assets/app-c3d4.js",
						src: "js/app.js",
						isEntry: true,
						css: ["assets/app-c3d4.css"],
						imports: ["js/vendor.js"],
					},
					"js/vendor.js": {
						file: "assets/vendor-e5f6.js",
						css: ["assets/vendor-e5f6.css"],
					},
				},
				null,
				2,
			),
		);

		const html = renderViteTags(["css/app.css", "js/app.js"], {
			cwd: root,
			publicDirectory: "public",
			buildDirectory: "themes/phoenix",
		});

		expect(html).toContain('href="/themes/phoenix/assets/app-a1b2.css"');
		expect(html).toContain('href="/themes/phoenix/assets/app-c3d4.css"');
		expect(html).toContain('href="/themes/phoenix/assets/vendor-e5f6.css"');
		expect(html).toContain('rel="modulepreload" href="/themes/phoenix/assets/vendor-e5f6.js"');
		expect(html).toContain('src="/themes/phoenix/assets/app-c3d4.js"');
	});

	it("should render dev tags from hot file", () => {
		const root = createTempDir();
		cleanupTargets.push(root);

		const publicDir = path.join(root, "public");
		mkdirSync(publicDir, { recursive: true });
		writeFileSync(path.join(publicDir, "hot"), "http://localhost:5173");

		const html = renderViteTags("js/app.js", {
			cwd: root,
			publicDirectory: "public",
			buildDirectory: "themes/phoenix",
		});

		expect(html).toContain('src="http://localhost:5173/@vite/client"');
		expect(html).toContain('src="http://localhost:5173/js/app.js"');
	});

	it("should expose @vite directive via KireVite plugin", async () => {
		const root = createTempDir();
		cleanupTargets.push(root);

		const outputDir = path.join(root, "public", "themes", "phoenix");
		mkdirSync(outputDir, { recursive: true });
		writeFileSync(
			path.join(outputDir, "manifest.json"),
			JSON.stringify({
				"js/app.js": {
					file: "assets/app-prod.js",
					src: "js/app.js",
					isEntry: true,
				},
			}),
		);

		const kire = new Kire({ root, silent: true, production: true }).plugin(
			KireVite,
			{
				cwd: root,
				publicDirectory: "public",
				buildDirectory: "themes/phoenix",
				input: ["js/app.js"],
			},
		);

		const html = await kire.render("<head>@vite()</head>");
		expect(html).toContain('src="/themes/phoenix/assets/app-prod.js"');
	});

	it("should compile .kire templates when kire mode is enabled", async () => {
		const root = createTempDir();
		cleanupTargets.push(root);

		const viewsDir = path.join(root, "views");
		mkdirSync(viewsDir, { recursive: true });
		writeFileSync(path.join(viewsDir, "index.kire"), "<h1>Hello {{ name }}</h1>");

		const plugin = kireVite({
			kire: true,
			root: "views",
			namespaces: {
				views: ["views/**/*.kire"],
			},
			outfile: ".kire.builded.js",
		});

		plugin.configResolved?.({ root } as any);
		await plugin.buildStart?.();

		const bundleFile = path.join(root, ".kire.builded.js");
		expect(existsSync(bundleFile)).toBe(true);

		const bundleContent = readFileSync(bundleFile, "utf8");
		expect(bundleContent).toContain("index.kire");
		expect(bundleContent).toContain("const _kire_bundled = {");
	});
});
