import { createHash } from "node:crypto";
import type { KirePlugin, KireHandler } from "kire";
import type { KireAsset, KireAssetsOptions } from "./types";

export const KireAssets: KirePlugin<KireAssetsOptions> = {
	name: "@kirejs/assets",
	sort: 200,
	load(kire, opts) {
		const prefix = opts?.prefix || "_kire";
		const domain = opts?.domain || "";
		const MAX_CACHE_SIZE = 500;
		const getBaseUrl = () => (domain ? `${domain}/${prefix}` : `/${prefix}`);

		const cache = kire.cached("@kirejs/assets");

        kire.existVar('__kire_assets', (api) => {
            api.prologue(`const __kire_assets = { scripts: [], styles: [], baseUrl: "${getBaseUrl()}" };`);
            api.epilogue(`
                if (typeof __kire_assets !== 'undefined') {
                    const _assets_placeholder = '<!-- KIRE:assets -->';
                    const _assets_baseUrl = __kire_assets.baseUrl;
                    let _assets_output = "";
                    
                    const _uniqueStyles = [];
                    for (let i = 0; i < __kire_assets.styles.length; i++) {
                        if (_uniqueStyles.indexOf(__kire_assets.styles[i]) === -1) _uniqueStyles.push(__kire_assets.styles[i]);
                    }
                    const _assetCache = this.cached("@kirejs/assets");
                    for (let i = 0; i < _uniqueStyles.length; i++) {
                        const _hash = _uniqueStyles[i];
                        if (_assetCache[_hash]) {
                            _assets_output += '<link rel="stylesheet" href="' + _assets_baseUrl + '/' + _hash + '.css" />\\n';
                        }
                    }

                    const _uniqueScripts = [];
                    for (let i = 0; i < __kire_assets.scripts.length; i++) {
                        if (_uniqueScripts.indexOf(__kire_assets.scripts[i]) === -1) _uniqueScripts.push(__kire_assets.scripts[i]);
                    }
                    for (let i = 0; i < _uniqueScripts.length; i++) {
                        const _hash = _uniqueScripts[i];
                        const _asset = _assetCache[_hash];
                        if (_asset && _asset.type === "mjs") {
                            _assets_output += '<script type="module" src="' + _assets_baseUrl + '/' + _hash + '.mjs"></script>\\n';
                        } else if (_asset) {
                            _assets_output += '<script src="' + _assets_baseUrl + '/' + _hash + '.js" defer></script>\\n';
                        }
                    }
                    
                    if ($kire_response.indexOf(_assets_placeholder) !== -1) {
                        $kire_response = $kire_response.split(_assets_placeholder).join(_assets_output);
                    } else {
                        $kire_response += _assets_output;
                    }
                }
            `);
        },true);

		const addToCache = (key: string, value: KireAsset) => {
			if (cache[key]) return;
            const keys = Object.keys(cache);
			if (keys.length >= MAX_CACHE_SIZE) {
				const firstKey = keys[0];
				if (firstKey) delete cache[firstKey];
			}
			cache[key] = value;
		};

		// Helper to manually add an asset
		kire.$global(
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
		kire.$global("$loadSVGAsset", async (path: string) => {
			let content = "";
			try {
				if (path.startsWith("http://") || path.startsWith("https://")) {
					const res = await fetch(path);
					if (res.ok) content = await res.text();
					else console.warn(`[KireAssets] Failed to fetch SVG: ${path}`);
				} else {
					content = kire.readFile(kire.resolvePath(path));
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
			params: ["path", "attrs"],
			description: `Loads an SVG and renders it as an <img> tag pointing to the asset.`,
			example: `@svg('./icons/logo.svg', { class: 'h-4 w-4' })`,
			onCall(api) {
				const pathExpr = api.getArgument(0);
				const attrsExpr = api.getArgument(1) || "{}";

                api.markAsync();
				api.write(`await (async () => {
                    const $hash = await $globals.$loadSVGAsset(${pathExpr});
                    const $attrs = ${attrsExpr};
                    if ($hash) {
                        const $src = "${getBaseUrl()}/" + $hash + ".svg";
                        let $attrsStr = "";
                        for (const [$key, $value] of Object.entries($attrs)) {
                            $attrsStr += " " + $key + '="' + $value + '"';
                        }
                        $kire_response += '<img src="' + $src + '"' + $attrsStr + ' />';
                    } else {
                        $kire_response += '<!-- SVG not found: ' + ${pathExpr} + ' -->';
                    }
                })();`);
			},
		});

		// Handle <style>
		kire.element({
			name: "style",
			description: `Captures inline styles to be injected via @assets.`,
			example: `<style>body { color: red; }</style>`,
			onCall(api) {
                api.write(`__kire_assets;`);
                const attrs = api.node.attributes || {};
				if (attrs.nocache !== undefined) {
                    api.append('<style');
                    for (const [key, val] of Object.entries(attrs)) {
                        api.append(` ${key}=${JSON.stringify(val)}`);
                    }
                    api.append('>');
                    api.renderChildren();
                    api.append('</style>');
                    return;
                }

                let content = "";
                for (const child of api.node.children || []) {
                    if (child.type === "text") content += child.content;
                    else if (child.type === "interpolation") content += `{{ ${child.content} }}`;
                }

				if (!content.trim()) return;

				const hash = createHash("md5")
					.update(content)
					.digest("hex")
					.slice(0, 8);

				addToCache(hash, { hash, content, type: "css" });

                api.write(`if (typeof __kire_assets !== 'undefined' && __kire_assets.styles.indexOf("${hash}") === -1) __kire_assets.styles.push("${hash}");`);
			},
		});

		// Handle <script>
		kire.element({
			name: "script",
			description: `Captures inline scripts to be injected via @assets.`,
			example: `<script>console.log('hello');</script>`,
			onCall(api) {
                api.write(`__kire_assets;`);
                const attrs = api.node.attributes || {};
				if (
					attrs.src ||
					attrs.nocache !== undefined
				) {
                    api.append('<script');
                    for (const [key, val] of Object.entries(attrs)) {
                        api.append(` ${key}=${JSON.stringify(val)}`);
                    }
                    api.append('>');
                    api.renderChildren();
                    api.append('</script>');
                    return;
                }

                let content = "";
                for (const child of api.node.children || []) {
                    if (child.type === "text") content += child.content;
                    else if (child.type === "interpolation") content += `{{ ${child.content} }}`;
                }

				if (!content.trim()) return;

				const hash = createHash("md5")
					.update(content)
					.digest("hex")
					.slice(0, 8);

				let type: "js" | "mjs" = "js";
				if (
					attrs.type === "module" ||
					content.includes("import ") ||
					content.includes("export ") ||
					content.includes("import.")
				) {
					type = "mjs";
				}

				addToCache(hash, { hash, content, type });

                api.write(`if (typeof __kire_assets !== 'undefined' && __kire_assets.scripts.indexOf("${hash}") === -1) __kire_assets.scripts.push("${hash}");`);
			},
		});

		// @assets() directive
		kire.directive({
			name: "assets",
			children: false,
			description: `Injects the assets placeholder where scripts and styles will be output.`,
			example: `@assets()`,
			onCall(api) {
                api.write(`__kire_assets;`);
				api.write(`$kire_response += '<!-- KIRE:assets -->';\n`);
			},
		});
	},
};
