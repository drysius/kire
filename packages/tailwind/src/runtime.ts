import { createHash } from "node:crypto";
import { extractCandidates } from "./compiler";
import type { TailwindCompileOptions } from "./types";

export interface TailwindBlock {
	/** Unique HTML-comment marker placed where the compiled `<style>` goes. */
	marker: string;
	/** The CSS source written inside the <tailwind> block / @tailwind directive. */
	css: string;
}

/** The runtime `__kire_assets` object, when the assets plugin is active. */
export interface AssetsRuntime {
	styles: string[];
}

export interface RenderTailwindContext {
	options: TailwindCompileOptions;
	/** Compiled-CSS cache keyed on (css source + candidate set). */
	store: Map<string, string>;
	/** Late-bound compile fn (so it stays overridable/spy-able). */
	compile: (
		css: string,
		options: TailwindCompileOptions,
		candidates: string[],
	) => Promise<string>;
	/** When present, compiled CSS is offloaded to the assets pipeline. */
	assets?: AssetsRuntime | null;
	assetCache?: Record<string, { hash: string; content: string; type: string }> | null;
}

const MAX_CACHE_ENTRIES = 200;

/**
 * Finalize Tailwind for one rendered page: scan the full HTML for class-name
 * candidates, compile each registered block against them, then either inline a
 * `<style>` at each marker or — when the assets plugin is active — register the
 * CSS as a hashed asset and drop the marker. Runs once per render in the template
 * epilogue, so candidates include classes from the entire output.
 */
export async function renderTailwindBlocks(
	html: string,
	blocks: TailwindBlock[],
	ctx: RenderTailwindContext,
): Promise<string> {
	if (!blocks || blocks.length === 0) return html;

	const candidates = extractCandidates(html);
	const candidateKey = candidates.slice().sort().join(" ");

	let out = html;
	for (const block of blocks) {
		let css = block.css;
		if (!css.includes('@import "tailwindcss"')) css = `@import "tailwindcss";\n${css}`;

		const key = `${css} ${candidateKey}`;
		let compiled = ctx.store.get(key);
		if (compiled === undefined) {
			compiled = await ctx.compile(css, ctx.options, candidates);
			if (ctx.store.size >= MAX_CACHE_ENTRIES) {
				const oldest = ctx.store.keys().next().value;
				if (oldest !== undefined) ctx.store.delete(oldest);
			}
			ctx.store.set(key, compiled);
		}

		if (ctx.assets && ctx.assetCache && compiled) {
			const hash = createHash("md5").update(compiled).digest("hex").slice(0, 8);
			if (!ctx.assetCache[hash]) ctx.assetCache[hash] = { hash, content: compiled, type: "css" };
			if (ctx.assets.styles.indexOf(hash) === -1) ctx.assets.styles.push(hash);
			out = out.replace(block.marker, "");
		} else {
			out = out.replace(block.marker, compiled ? `<style>${compiled}</style>` : "");
		}
	}
	return out;
}
