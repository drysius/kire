import { createHash } from "node:crypto";
import { kirePlugin, type KirePlugin, type KireHandler } from "kire";
import { compileCSSWithTailwind } from "./compiler";
import { loadModule, loadStylesheet } from "./loader";
import type { TailwindCompileOptions } from "./types";

export const KireTailwind = kirePlugin<TailwindCompileOptions>({}, (kire, opts) => {
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
        cache.options = tailwindOptions;

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
                        
                        let $tailwind_content = ${contentExpr};
                        if (!$tailwind_content.includes('@import "tailwindcss"')) {
                            $tailwind_content = '@import "tailwindcss";\\n' + $tailwind_content;
                        }

                        let $processedCSS = "";
                        if (this.production && $id && $tailwindCache[$id]) {
                            $processedCSS = $tailwindCache[$id];
                        } else {
                            const $candidates = []; 
                            $processedCSS = await this.compileCSSWithTailwind(
                                $tailwind_content,
                                $tailwindCache.options,
                                $candidates
                            );
                            if (this.production && $id) {
                                $tailwindCache[$id] = $processedCSS;
                            }
                        }

                        // Integration with @kirejs/assets - Just use if available
                        if (typeof __kire_assets !== 'undefined') {
                            const { createHash } = await import("node:crypto");
                            const $hash = createHash("md5").update($processedCSS).digest("hex").slice(0, 8);
                            const $assetCache = this.cached("@kirejs/assets");
                            if (!$assetCache[$hash]) {
                                $assetCache[$hash] = { hash: $hash, content: $processedCSS, type: "css" };
                            }
                            if (__kire_assets.styles.indexOf($hash) === -1) __kire_assets.styles.push($hash);
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
                api.markAsync();
                
                api.write(`await (async () => {
                    try {
                        const $tailwindCache = this.cached("@kirejs/tailwind");
                        let $tailwind_content = ${codeExpr ? `String(${codeExpr})` : '""'};
                `);

                if (!codeExpr) {
                    const contentId = api.uid("tw_content");
                    api.write(`{ 
                        const _oldRes${contentId} = $kire_response; $kire_response = "";`);
                    api.renderChildren();
                    api.write(`
                        $tailwind_content = $kire_response;
                        $kire_response = _oldRes${contentId};
                    }`);
                }

                api.write(`
                        if (!$tailwind_content.includes('@import "tailwindcss"')) {
                            $tailwind_content = '@import "tailwindcss";\\n' + $tailwind_content;
                        }

                        const $processedCSS = await this.compileCSSWithTailwind(
                            $tailwind_content,
                            $tailwindCache.options,
                            []
                        );

                        if (typeof __kire_assets !== 'undefined') {
                            const { createHash } = await import("node:crypto");
                            const $hash = createHash("md5").update($processedCSS).digest("hex").slice(0, 8);
                            const $assetCache = this.cached("@kirejs/assets");
                            if (!$assetCache[$hash]) {
                                $assetCache[$hash] = { hash: $hash, content: $processedCSS, type: "css" };
                            }
                            if (__kire_assets.styles.indexOf($hash) === -1) __kire_assets.styles.push($hash);
                        } else {
                            $kire_response += '<style>' + $processedCSS + '</style>';
                        }
                    } catch (e) {
                        console.warn("Tailwind compilation error:", e);
                    }
                }).call(this);`);
			},
		});

        // Inject helpers into Kire instance
        (kire as any).compileCSSWithTailwind = compileCSSWithTailwind;
    }
);
