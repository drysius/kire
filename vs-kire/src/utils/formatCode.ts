import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";
import postcss from "prettier/plugins/postcss";
import typescript from "prettier/plugins/typescript";
import * as prettier from "prettier/standalone";

export type FormatLanguage = "javascript" | "typescript" | "css";

export interface FormatOptions {
	tabWidth?: number;
	useTabs?: boolean;
	printWidth?: number;
}

function parserFor(language: FormatLanguage): { parser: string; plugins: unknown[] } {
	switch (language) {
		case "typescript":
			return { parser: "typescript", plugins: [typescript, estree] };
		case "css":
			return { parser: "css", plugins: [postcss] };
		default:
			return { parser: "babel", plugins: [babel, estree] };
	}
}

/**
 * Format an embedded code fragment (the body of a `<?js ?>`, `<script>`, or
 * `<style>` block) with Prettier's standalone build. Returns the formatted code
 * without a trailing newline, or `null` when the fragment can't be parsed (a
 * syntax error mid-edit) so the caller can fall back to plain re-indentation.
 */
export async function formatCode(
	code: string,
	language: FormatLanguage,
	options: FormatOptions = {},
): Promise<string | null> {
	if (!code.trim()) return "";
	const { parser, plugins } = parserFor(language);
	try {
		const out = await prettier.format(code, {
			parser,
			plugins: plugins as never,
			tabWidth: options.tabWidth ?? 2,
			useTabs: options.useTabs ?? false,
			printWidth: options.printWidth ?? 100,
			semi: true,
		});
		return out.replace(/\n+$/, "");
	} catch {
		return null;
	}
}
