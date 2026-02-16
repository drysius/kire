import { createHash } from "node:crypto";
import type { KirePlugin, KireHandler } from "kire";
import { compileCSSWithTailwind } from "./compiler";
import { loadModule, loadStylesheet } from "./loader";
import type { TailwindCompileOptions } from "./types";

export const KireTailwind: KirePlugin<NonNullable<TailwindCompileOptions>> = {
	name: "@kirejs/tailwind",
	sort: 110,
	options: {},
	load(kire, opts) {
        kire.kireSchema({
            name: "@kirejs/tailwind",
            author: "Drysius",
            repository: "https://github.com/drysius/kire",
            version: "0.1.0"
        });

		const tailwindOptions: TailwindCompileOptions = {
			...opts,
			loadStylesheet,
			loadModule,
			from: undefined,
		};

		const cache = kire.cached("@kirejs/tailwind");

		/**
		 * <tailwind> element for CSS content processing
		 */
		kire.element({
			name: "tailwind",
			description: "Processes CSS content within the block using Tailwind CSS.",
			example:
				"<tailwind>@tailwind base; @tailwind components; @tailwind utilities;</tailwind>",
			onCall(api) {
                const attrs = api.node.attributes || {};
                const id = attrs.id;

                api.markAsync();
                
                // Build content expression
                const $children = api.node.children || [];
                let contentExpr = '""';
                for (const $child of $children) {
                    if ($child.type === "text") contentExpr += ` + ${JSON.stringify($child.content)}`;
                    else if ($child.type === "interpolation") contentExpr += ` + (${$child.content})`;
                }

                api.write(`await (async () => {
                    try {
                        const $id = ${JSON.stringify(id)};
                        const $tailwindCache = this.cached("@kirejs/tailwind");
                        if (this.production && $id && $tailwindCache[$id]) {
                            const $cachedCss = $tailwindCache[$id];
                            if ($globals.$assets) {
                                const { createHash } = await import("node:crypto");
                                const $hash = createHash("md5").update($cachedCss).digest("hex").slice(0, 8);
                                const $assetCache = this.cached("@kirejs/assets");
                                if (!$assetCache[$hash]) {
                                    $assetCache[$hash] = { hash: $hash, content: $cachedCss, type: "css" };
                                }
                                if ($globals.$assets.styles.indexOf($hash) === -1) $globals.$assets.styles.push($hash);
                            } else {
                                $kire_response += '<style>' + $cachedCss + '</style>';
                            }
                            return;
                        }

                        let $tailwind_content = ${contentExpr};
                        if (!$tailwind_content.includes('@import "tailwindcss"')) {
                            $tailwind_content = '@import "tailwindcss";\\n' + $tailwind_content;
                        }

                        // Candidates extraction
                        const $candidates = []; 
                        
                        const $processedCSS = await this.compileCSSWithTailwind(
                            $tailwind_content,
                            ${JSON.stringify(tailwindOptions)},
                            $candidates
                        );

                        if (this.production && $id) {
                            $tailwindCache[$id] = $processedCSS;
                        }

                        // Integration with @kirejs/assets
                        if ($globals.$assets) {
                            const { createHash } = await import("node:crypto");
                            const $hash = createHash("md5").update($processedCSS).digest("hex").slice(0, 8);
                            const $assetCache = this.cached("@kirejs/assets");
                            if (!$assetCache[$hash]) {
                                $assetCache[$hash] = { hash: $hash, content: $processedCSS, type: "css" };
                            }
                            if ($globals.$assets.styles.indexOf($hash) === -1) $globals.$assets.styles.push($hash);
                        } else {
                            $kire_response += '<style>' + $processedCSS + '</style>';
                        }
                    } catch (e) {
                        console.warn("Tailwind compilation error:", e);
                    }
                }).call(this);`);
			},
		});

		/**
		 * @tailwind directive for processing CSS with Tailwind
		 */
		kire.directive({
			name: "tailwind",
			params: ["code"],
			children: true,
			description: "Processes CSS content within the block using Tailwind CSS.",
			example:
				"@tailwind\n  @tailwind base;\n  @tailwind components;\n  @tailwind utilities;\n@end",
			onCall(api) {
				const codeExpr = api.getArgument(0);
                
                api.write(`$kire_response += '<tailwind';`);
                if (api.kire.production) {
                    api.prologue(`const { createHash } = await import("node:crypto");`);
                    api.write(`$kire_response += ' id="' + createHash("sha256").update(${codeExpr} || "").digest("hex") + '"';`);
                }
                api.write(`$kire_response += '>';`);
                if (codeExpr) {
                    api.write(`$kire_response += ${codeExpr};`);
                } else {
                    api.renderChildren();
                }
                api.write(`$kire_response += '</tailwind>';`);
			},
		});

        // Inject helpers into Kire instance
        (kire as any).compileCSSWithTailwind = compileCSSWithTailwind;
	},
};
