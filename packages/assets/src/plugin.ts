import { createHash } from "node:crypto";
import type { KirePlugin } from "kire";
import type { KireAsset, KireAssetsOptions } from "./types";

export const KireAssets: KirePlugin<KireAssetsOptions> = {
	name: "@kirejs/assets",
	sort: 200,
	options: {
		prefix: "_kire",
	},
	load(kire, opts) {
		const prefix = opts?.prefix || "_kire";
		const domain = opts?.domain || "";
		const injectionTag = "kire-assets-injection-point";
		const MAX_CACHE_SIZE = 500;
		const getBaseUrl = () => (domain ? `${domain}/${prefix}` : `/${prefix}`);

		const cache = kire.cached<KireAsset>("@kirejs/assets");

		const addToCache = (key: string, value: KireAsset) => {
			if (cache.has(key)) return;
			if (cache.size >= MAX_CACHE_SIZE) {
				const firstKey = cache.keys().next().value;
				if (firstKey) cache.delete(firstKey);
			}
			cache.set(key, value);
		};

		// Helper to manually add an asset
		kire.$ctx(
			"$addAsset",
			(content: string, type: "js" | "css" | "mjs" | "svg" = "js") => {
				const hash = createHash("md5")
					.update(content)
					.digest("hex")
					.slice(0, 8);
				addToCache(hash, { hash, content, type });
				return hash;
			},
		);

		// Helper to load SVG content and register it as an asset
		kire.$ctx("$loadSVGAsset", async (path: string) => {
			let content = "";
			try {
				if (path.startsWith("http://") || path.startsWith("https://")) {
					const res = await fetch(path);
					if (res.ok) content = await res.text();
					else console.warn(`[KireAssets] Failed to fetch SVG: ${path}`);
				} else {
					content = await kire.$resolver(path);
				}
			} catch (e) {
				console.warn(`[KireAssets] Error loading SVG '${path}':`, e);
				return null;
			}

			if (content) {
				const hash = createHash("md5")
					.update(content)
					.digest("hex")
					.slice(0, 8);

				addToCache(hash, { hash, content, type: "svg" });
				return hash;
			}
			return null;
		});

		// @svg directive
		kire.directive({
			name: "svg",
			params: ["path:string", "attrs:object"],
			description: `Loads an SVG and renders it as an <img> tag pointing to the asset.`,
			example: `@svg('./icons/logo.svg', { class: 'h-4 w-4' })`,
			onCall(ctx) {
				const pathExpr = ctx.param("path");
				const attrsExpr = ctx.param("attrs") || "{}";

				ctx.raw(`await (async () => {
                    const hash = await $ctx.$loadSVGAsset(${JSON.stringify(pathExpr)});
                    const attrs = ${attrsExpr};
                    if (hash) {
                        const src = "${getBaseUrl()}/" + hash + ".svg";
                        let attrsStr = "";
                        for (const [key, value] of Object.entries(attrs)) {
                            attrsStr += " " + key + '="' + value + '"';
                        }
                        $ctx.$add('<img src="' + src + '"' + attrsStr + ' />');
                    } else {
                        $ctx.$add('<!-- SVG not found: ' + ${JSON.stringify(pathExpr)} + ' -->');
                    }
                })();`);
			},
		});

		// Handle <style>
		kire.element({
			name: "style",
			description: `Captures inline styles to be injected via @assets.`,
			example: `<style>body { color: red; }</style>`,
			async run(ctx) {
				if (ctx.element.attributes.nocache !== undefined) return;
				const content = ctx.element.inner;
				if (!content.trim()) return;

				const hash = createHash("md5")
					.update(content)
					.digest("hex")
					.slice(0, 8);

				addToCache(hash, { hash, content, type: "css" });

                if (!ctx._assets) ctx._assets = { scripts: [], styles: [] };
				ctx._assets.styles.push(hash);
				ctx.replace("");
			},
		});

		// Handle <script>
		kire.element({
			name: "script",
			description: `Captures inline scripts to be injected via @assets.`,
			example: `<script>console.log('hello');</script>`,
			async run(ctx) {
				if (
					ctx.element.attributes.src ||
					ctx.element.attributes.nocache !== undefined
				)
					return;

				const content = ctx.element.inner;
				if (!content.trim()) return;

				const hash = createHash("md5")
					.update(content)
					.digest("hex")
					.slice(0, 8);

				let type: "js" | "mjs" = "js";
				if (
					ctx.element.attributes.type === "module" ||
					content.includes("import ") ||
					content.includes("export ") ||
					content.includes("import.")
				) {
					type = "mjs";
				}

				addToCache(hash, { hash, content, type });

                if (!ctx._assets) ctx._assets = { scripts: [], styles: [] };
				ctx._assets.scripts.push(hash);
				ctx.replace("");
			},
		});

		// @assets() directive
		kire.directive({
			name: "assets",
			description: `Injects the assets placeholder where scripts and styles will be output.`,
			example: `@assets()`,
			onInit(ctx) {
                if (!ctx._assets) ctx._assets = { scripts: [], styles: [] };
				ctx.$on("after", async (c: any) => {
					const assets = c._assets;
					const placeholder = `<!-- KIRE:assets -->`;
					if (assets && c.$response.includes(placeholder)) {
						let output = "";
						const uniqueStyles = [...new Set(assets.styles as string[])];
						for (const hash of uniqueStyles) {
							output += `<link rel="stylesheet" href="${getBaseUrl()}/${hash}.css" />\n`;
						}
						const uniqueScripts = [...new Set(assets.scripts as string[])];
						for (const hash of uniqueScripts) {
							const asset = cache.get(hash);
							if (asset && asset.type === "mjs") {
								output += `<script type="module" src="${getBaseUrl()}/${hash}.mjs"></script>\n`;
							} else {
								output += `<script src="${getBaseUrl()}/${hash}.js" defer></script>\n`;
							}
						}
						c.$response = c.$response.split(placeholder).join(output);
					}
				});
			},
			onCall(ctx) {
                ctx.pre(`if (typeof $ctx._assets === 'undefined') $ctx._assets = { scripts: [], styles: [] };`);
				ctx.raw(`$ctx.$add('<!-- KIRE:assets -->');\n`);
			},
		});

		// Injection point handler
		kire.element({
			name: injectionTag,
			description: `Internal placeholder for assets injection.`,
			example: `<!-- Internal Use -->`,
			async run(ctx) {
				ctx.replace("<!-- KIRE:assets -->");
			},
		});
	},
};
