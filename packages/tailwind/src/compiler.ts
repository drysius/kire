import { compile } from "tailwindcss";
import type { TailwindCompileOptions } from "./types";

/**
 * Compile a CSS source with Tailwind, generating utilities for `candidates`.
 *
 * Tailwind v4 only emits utility CSS for the class names handed to `build()`.
 * The candidates must be scanned from the rendered markup (see
 * {@link extractCandidates}) — passing an empty list yields base/preflight only,
 * which is the classic "Tailwind produces no utilities" failure.
 */
export async function compileCSSWithTailwind(
	css: string,
	options: TailwindCompileOptions,
	candidates: string[] = [],
): Promise<string> {
	if (!css?.trim()) return "";
	const result = await compile(css, options);
	return result.build(candidates);
}

const CLASS_ATTR_REGEX = /class\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/**
 * Extract Tailwind class-name candidates from rendered HTML. Reads every
 * `class="…"` / `class='…'` attribute and splits on whitespace, preserving
 * variant/arbitrary syntax (`hover:bg-red-500`, `p-[4px]`, `lg:flex`). Returns a
 * de-duplicated list suitable for {@link compileCSSWithTailwind}.
 */
export function extractCandidates(html: string): string[] {
	const set = new Set<string>();
	CLASS_ATTR_REGEX.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = CLASS_ATTR_REGEX.exec(html)) !== null) {
		const value = match[1] ?? match[2] ?? "";
		for (const token of value.split(/\s+/)) {
			if (token) set.add(token);
		}
	}
	return [...set];
}
