import { compile } from "tailwindcss";
import type { TailwindCompileOptions } from "./types";

/**
 * Processes CSS using Tailwind's compilation API
 */
export async function compileCSSWithTailwind(
	css: string,
	options: TailwindCompileOptions,
	candidates: string[] = [],
): Promise<string> {
	try {
		if (!css || !css.trim()) return "";

		const result = await compile(css, options);
		const processedCSS = result.build(candidates);

		return processedCSS;
	} catch (error) {
		console.error("Error in Tailwind compilation:", error);
		throw error;
	}
}
