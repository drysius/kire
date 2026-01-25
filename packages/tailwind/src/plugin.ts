import { createHash } from "node:crypto";
import type { KirePlugin } from "kire";
import { compileCSSWithTailwind } from "./compiler";
import { loadModule, loadStylesheet } from "./loader";
import type { TailwindCompileOptions } from "./types";

export const KireTailwind: KirePlugin<NonNullable<TailwindCompileOptions>> = {
	name: "@kirejs/tailwind",
	sort: 110,
	options: {},
	async load(kire, opts) {
		const tailwindOptions: TailwindCompileOptions = {
			...opts,
			loadStylesheet,
			loadModule,
			from: undefined,
		};

		const cache = kire.cached<string>("@kirejs/tailwind");

		/**
		 * @tailwind directive for processing CSS with Tailwind
		 */
		kire.directive({
			name: "tailwind",
			params: ["code:string"],
			children: true,
			childrenRaw: true,
			description: "Processes CSS content within the block using Tailwind CSS.",
			example:
				"@tailwind\n  @tailwind base;\n  @tailwind components;\n  @tailwind utilities;\n@end",
			async onCall(ctx) {
				try {
					let code = ctx.param("code");

					// Fallback to children content if no parameter provided
					if (!code && ctx.children && ctx.children.length > 0) {
						code = ctx.children.map((c) => c.content || "").join("");
					}

					// Use default Tailwind import if no code provided
					if (!code || !code.trim()) {
						code = "";
					}

					// Generate cache ID if caching is enabled
					if (kire.production) {
						const hash = createHash("sha256").update(code).digest("hex");
						ctx.raw(`$ctx.$add('<tailwind id="${hash}">');`);
					}
					else {
						ctx.raw('$ctx.$add("<tailwind>");');
					}

					ctx.raw(`$ctx.$add(${JSON.stringify(code)});`);
					ctx.raw('$ctx.$add("</tailwind>");');
				}
				catch (_error) {
					// Fallback behavior
					const code = ctx.param("code") || "";
					ctx.raw('$ctx.$add("<tailwind>");');
					ctx.raw(`$ctx.$add(${JSON.stringify(code)});`);
					ctx.raw('$ctx.$add("</tailwind>");');
				}
			},
		});

		/**
		 * <tailwind> element for CSS content processing
		 */
		kire.element({
			name: "tailwind",
			description: "Processes CSS content within the block using Tailwind CSS.",
			example:
				"<tailwind>@tailwind base; @tailwind components; @tailwind utilities;</tailwind>",
			async onCall(ctx) {
				// _assets should be initialized by the @assets() directive

				try {
					const id = ctx.element.attributes.id;

					// Use cached CSS if available and caching is enabled
					if (kire.production && id && cache.has(id)) {
						const cachedCss = cache.get(id) ?? "";
						const newHtml = ctx.content.replace(
							ctx.element.outer,
							`<style>${cachedCss}</style>`,
						);
						ctx.update(newHtml);
						return;
					}

					// Compilation logic (cache miss or caching disabled)
					let content = ctx.element.inner || "";

					// Ensure Tailwind CSS is imported if not present
					// This is required in v4 to load the default theme and utilities
					if (!content.includes('@import "tailwindcss"')) {
						content = `@import "tailwindcss";\n${content}`;
					}

					// Extract CSS classes from the entire HTML content
					const candidates = new Set<string>();
					const classRegex = /\bclass(?:Name)?\s*=\s*(["'])(.*?)\1/g;
					let match: RegExpExecArray;

					while ((match = classRegex.exec(ctx.content)!) !== null) {
						const cls = match[2]?.split(/\s+/);
						cls?.forEach((c) => {
							if (c) candidates.add(c);
						});
					}

					const processedCSS = await compileCSSWithTailwind(
						content, // Pass raw CSS content, might contain custom rules
						tailwindOptions,
						Array.from(candidates),
					);

					// Cache the result if caching is enabled
					if (kire.production && id) {
						cache.set(id, processedCSS);
					}

					// Integration with @kirejs/assets
					// If the assets plugin is active, we can offload the CSS to a file
					// and let the browser cache it, rather than inlineing it every time.
					if ((ctx as any)._assets) {
						const assetCache = kire.cached<any>("@kirejs/assets");
						const hash = createHash("md5")
							.update(processedCSS)
							.digest("hex")
							.slice(0, 8);

						if (!assetCache.has(hash)) {
							assetCache.set(hash, {
								hash,
								content: processedCSS,
								type: "css",
							});
						}

						(ctx as any)._assets.styles.push(hash);
						// Remove the element as the link will be injected by @assets
						ctx.update(ctx.content.replace(ctx.element.outer, ""));
						return;
					}

					const newHtml = ctx.content.replace(
						ctx.element.outer,
						`<style>${processedCSS}</style>`,
					);
					ctx.update(newHtml);
				}
				catch (error) {
					console.warn("Tailwind compilation error:", error);
					// Fallback: use original content without processing
					const newHtml = ctx.content.replace(
						ctx.element.outer,
						`<style>${ctx.element.inner || ""}</style>`,
					);
					ctx.update(newHtml);
				}
			},
		});
	},
};
