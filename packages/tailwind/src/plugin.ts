import { kirePlugin } from "kire";
import { compileCSSWithTailwind } from "./compiler";
import { loadModule, loadStylesheet } from "./loader";
import { type AssetsRuntime, renderTailwindBlocks, type TailwindBlock } from "./runtime";
import type { TailwindCompileOptions } from "./types";

interface TailwindCache {
	options: TailwindCompileOptions;
	__compiled?: Map<string, string>;
}

/**
 * Kire Tailwind plugin.
 *
 * A `<tailwind>` block (or `@tailwind` directive) declares a CSS source. The real
 * work happens once per render, in the template epilogue: the full HTML is scanned
 * for class-name candidates and Tailwind is compiled against them, so every
 * utility used anywhere on the page is generated. Results are cached by
 * (css source + candidate set).
 */
export const KireTailwind = kirePlugin<TailwindCompileOptions>({}, (kire, opts) => {
	kire.kireSchema({
		name: "@kirejs/tailwind",
		author: "Drysius",
		repository: "https://github.com/drysius/kire",
		version: "0.2.0",
	});

	const tailwindOptions: TailwindCompileOptions = {
		...opts,
		loadStylesheet,
		loadModule,
		from: undefined,
	};

	const cache = kire.cached("@kirejs/tailwind") as TailwindCache;
	cache.options = tailwindOptions;

	const engine = kire as unknown as {
		compileCSSWithTailwind: typeof compileCSSWithTailwind;
		__renderTailwind: (
			html: string,
			blocks: TailwindBlock[],
			assets: AssetsRuntime | null,
		) => Promise<string>;
	};

	// Engine helpers used by generated template code.
	engine.compileCSSWithTailwind = compileCSSWithTailwind;
	engine.__renderTailwind = (html, blocks, assets) => {
		const c = kire.cached("@kirejs/tailwind") as TailwindCache;
		return renderTailwindBlocks(html, blocks, {
			options: c.options,
			store: (c.__compiled ??= new Map()),
			compile: (css, options, candidates) => engine.compileCSSWithTailwind(css, options, candidates),
			assets,
			assetCache: assets ? (kire.cached("@kirejs/assets") as Record<string, never>) : null,
		});
	};

	// Declare the per-render block registry once, and finalize in the epilogue
	// (after the body so candidates cover the whole page; before assets resolution
	// when the assets plugin is loaded first, so its CSS is offloaded there).
	kire.existVar(
		"__twBlocks",
		(api) => {
			api.markAsync();
			api.prologue("const __twBlocks = [];");
			api.epilogue(
				"$kire_response = await this.__renderTailwind($kire_response, __twBlocks, typeof __kire_assets !== 'undefined' ? __kire_assets : null);",
			);
		},
		true,
	);

	const registerBlock = (api: { write(js: string): void }, marker: string, cssExpr: string) => {
		api.write(`__twBlocks.push({ marker: ${JSON.stringify(marker)}, css: ${cssExpr} });`);
	};

	// <tailwind>…css…</tailwind>
	kire.element({
		name: "tailwind",
		description: "Compiles the CSS inside against the page's Tailwind classes.",
		example: "<tailwind>@theme { --color-brand: #16a34a; }</tailwind>",
		onCall(api) {
			api.markAsync();
			let cssExpr = '""';
			for (const child of api.node.children || []) {
				if (child.type === "text") cssExpr += ` + ${JSON.stringify(child.content)}`;
				else if (child.type === "interpolation") cssExpr += ` + (${child.content})`;
			}
			const marker = `<!--KIRE_TW_${api.uid("tw")}-->`;
			registerBlock(api, marker, cssExpr);
			api.append(marker);
		},
	});

	// @tailwind(cssExpr)  or  @tailwind …css… @end
	kire.directive({
		name: "tailwind",
		signature: ["code"],
		children: true,
		description: "Compiles the CSS argument/block against the page's Tailwind classes.",
		example: "@tailwind\n  @theme { --color-brand: #16a34a; }\n@end",
		onCall(api) {
			api.markAsync();
			const marker = `<!--KIRE_TW_${api.uid("tw")}-->`;
			const codeExpr = api.getArgument(0);
			if (codeExpr) {
				registerBlock(api, marker, `String(${codeExpr})`);
			} else {
				const cid = api.uid("twc");
				api.write(`{ const _old${cid} = $kire_response; $kire_response = "";`);
				api.renderChildren();
				registerBlock(api, marker, "$kire_response");
				api.write(`$kire_response = _old${cid}; }`);
			}
			api.append(marker);
		},
	});
});
