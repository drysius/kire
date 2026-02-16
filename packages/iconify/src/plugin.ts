import type { KirePlugin, KireHandler } from "kire";
import { fetchIcon, processSvgAttributes } from "./api";
import type { IconifyOptions } from "./types";

export const KireIconify: KirePlugin<IconifyOptions> = {
	name: "@kirejs/iconify",
	options: {},
	load(kire, opts) {
        kire.kireSchema({
            name: "@kirejs/iconify",
            author: "Drysius",
            repository: "https://github.com/drysius/kire",
            version: "0.1.0"
        });

		const apiUrl = opts?.apiUrl || "https://api.iconify.design";
		const defaultClass = opts?.defaultClass || "";

		const iconCache = kire.cached("@kirejs/iconify");

		kire.$global(
			"fetchIcon",
			async (name: string, params: Record<string, string> = kire.NullProtoObj()) => {
				return fetchIcon(name, apiUrl, params, iconCache);
			},
		);

		kire.directive({
			name: "icon",
			params: ["name", "className", "attrs"],
			description: "Renders an Iconify icon SVG.",
			example: "@icon('mdi:home', 'text-blue-500', { width: '24' })",
			onCall(api) {
				const nameExpr = api.getArgument(0);
				const classExpr = api.getArgument(1) || '""';
				const attrsExpr = api.getArgument(2) || "{}";

                api.markAsync();
				api.write(`await (async () => {
                    const $rawAttrs = ${attrsExpr};
                    const $apiParams = {};
                    const $htmlAttrs = {};
                    const $apiKeys = ['width', 'height', 'color', 'flip', 'rotate', 'box'];

                    for (const [$k, $v] of Object.entries($rawAttrs)) {
                        if ($apiKeys.includes($k)) $apiParams[$k] = $v;
                        else $htmlAttrs[$k] = $v;
                    }

                    const $svg = await $globals.fetchIcon(${nameExpr}, $apiParams);
                    const $cls = ${classExpr} || ${JSON.stringify(defaultClass)};

                    if ($svg.startsWith('<svg')) {
                        let $finalSvg = $svg;

                        if ($cls) {
                            // Extract actual class string if it was wrapped in extra quotes from template literal in test
                            const $actualCls = typeof $cls === 'string' && ($cls.startsWith("'") || $cls.startsWith('"')) 
                                ? $cls.slice(1, -1) 
                                : $cls;

                            if ($finalSvg.includes('class="')) {
                                $finalSvg = $finalSvg.replace('class="', 'class="' + $actualCls + ' ');
                            } else {
                                $finalSvg = $finalSvg.replace('<svg', '<svg class="' + $actualCls + '"');
                            }
                        }

                        for (const [$key, $value] of Object.entries($htmlAttrs)) {
                            const $regex = new RegExp($key + '="[^"]*"', 'g');
                            if ($regex.test($finalSvg)) {
                                $finalSvg = $finalSvg.replace($regex, $key + '="' + $value + '"');
                            } else {
                                $finalSvg = $finalSvg.replace('<svg', '<svg ' + $key + '="' + $value + '"');
                            }
                        }

                        $kire_response += $finalSvg;
                    } else {
                        $kire_response += $svg;
                    }
                })();`);
			},
		});

		kire.element({
			name: "iconify",
			description: "Renders an Iconify icon.",
			void: true,
			onCall(api) {
				const attrs = { ...api.node.attributes };
				const iconName = attrs.i || attrs.icon;

				if (!iconName) {
					api.write(`$kire_response += '<!-- <iconify> missing "i" or "icon" attribute -->';`);
					return;
				}

				delete attrs.i;
				delete attrs.icon;

				const className = attrs.class || attrs.className || defaultClass;
				delete attrs.class;
				delete attrs.className;

				if (attrs.size) {
					if (!attrs.width) attrs.width = attrs.size;
					if (!attrs.height) attrs.height = attrs.size;
					delete attrs.size;
				}

				const apiKeys = ["width", "height", "color", "flip", "rotate", "box"];
				const apiParams: Record<string, string> = {};
				const htmlAttrs: Record<string, string> = {};

				for (const [k, v] of Object.entries(attrs)) {
					if (apiKeys.includes(k)) {
						apiParams[k] = v;
					} else {
						htmlAttrs[k] = v;
					}
				}

                api.markAsync();
                api.write(`await (async () => {
                    try {
                        const $svg = await $globals.fetchIcon(${JSON.stringify(iconName)}, ${JSON.stringify(apiParams)});
                        const $finalSvg = this.processSvgAttributes($svg, ${JSON.stringify(className)}, ${JSON.stringify(htmlAttrs)});
                        $kire_response += $finalSvg;
                    } catch (e) {
                        $kire_response += '<!-- Iconify error: ' + e.message + ' -->';
                    }
                })();`);
			},
		});

        // Add helper to process attributes
        (kire as any).processSvgAttributes = processSvgAttributes;
	},
};
