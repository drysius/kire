import { escapeHtml } from "../utils/html";
import {
	INTERPOLATION_GLOBAL_REGEX,
	INTERPOLATION_PURE_REGEX,
	INTERPOLATION_START_REGEX,
	RESERVED_KEYWORDS_REGEX,
} from "../utils/regex";
import type { JsScanner } from "./js-scanner";

/**
 * Handles converting attribute values (which may contain {{ }} interpolations)
 * into JS expressions safe for use in compiled template code.
 *
 * Tracks whether $escape was used and which identifiers appeared inside
 * template-literal expressions (so the compiler can keep their declarations).
 */
export class AttrCodegen {
	usesEscape = false;
	readonly mixedAttrIdents = new Set<string>();

	constructor(
		private scanner: JsScanner,
		private onAsync: () => void,
	) {}

	reset(): void {
		this.usesEscape = false;
		this.mixedAttrIdents.clear();
	}

	// Wraps a static string as a JS template literal.
	// Escapes backslash, backtick, and dollar sign in the correct order.
	esc(str: string): string {
		return (
			"`" +
			str
				.replace(/\\/g, "\\\\")
				.replace(/`/g, "\\`")
				.replace(/\$/g, "\\$") +
			"`"
		);
	}

	// Escapes a static chunk for embedding inside a template literal.
	escapeChunk(str: string): string {
		return str
			.replace(/\\/g, "\\\\")
			.replace(/`/g, "\\`")
			.replace(/\$/g, "\\$");
	}

	/**
	 * Converts an attribute value (possibly containing {{ }}) into a JS expression.
	 *
	 * - No interpolation → returns the value verbatim (it's already a JS expression)
	 * - Pure `{{ expr }}` → returns `expr`
	 * - Mixed text+expressions → returns a template literal with $escape() calls
	 */
	parseAttrCode(val: string): string {
		if (!INTERPOLATION_START_REGEX.test(val)) return val;

		const pureMatch = val.match(INTERPOLATION_PURE_REGEX);
		if (pureMatch) return pureMatch[1]!;

		// Mixed: build a template literal, wrapping each expression in $escape()
		this.usesEscape = true;
		const res = val.replace(INTERPOLATION_GLOBAL_REGEX, (_, expr: string) => {
			this.collectExpressionIdents(expr);
			return `\${$escape(${expr})}`;
		});
		return "`" + res + "`";
	}

	/**
	 * Like parseAttrCode but also HTML-escapes static text chunks and wraps
	 * dynamic expressions in $escape(), producing output safe for quoted HTML attributes.
	 */
	parseHtmlAttrCode(val: string): string {
		if (!INTERPOLATION_START_REGEX.test(val)) return this.esc(escapeHtml(val));

		const pureMatch = val.match(INTERPOLATION_PURE_REGEX);
		if (pureMatch) {
			const expr = pureMatch[1]!;
			if (this.scanner.containsAwait(expr)) this.onAsync();
			this.usesEscape = true;
			return `$escape(${expr})`;
		}

		this.usesEscape = true;
		let out = "";
		let lastIndex = 0;
		const rx = new RegExp(INTERPOLATION_GLOBAL_REGEX.source, "g");
		let match: RegExpExecArray | null;

		while ((match = rx.exec(val)) !== null) {
			const literalChunk = val.slice(lastIndex, match.index);
			if (literalChunk) out += this.escapeChunk(escapeHtml(literalChunk));

			const expr = match[1] || "";
			this.collectExpressionIdents(expr);
			if (this.scanner.containsAwait(expr)) this.onAsync();
			out += `\${$escape(${expr})}`;
			lastIndex = match.index + match[0].length;
		}

		const tail = val.slice(lastIndex);
		if (tail) out += this.escapeChunk(escapeHtml(tail));

		return "`" + out + "`";
	}

	// ── Private ───────────────────────────────────────────────────────────────

	private collectExpressionIdents(expr: string): void {
		// Intentionally avoids ES2018 lookbehind — check the previous character manually
		const rx = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
		let m: RegExpExecArray | null;
		while ((m = rx.exec(expr)) !== null) {
			const id = m[0]!;
			if (RESERVED_KEYWORDS_REGEX.test(id)) continue;
			if (expr[m.index - 1] === ".") continue; // property access
			this.mixedAttrIdents.add(id);
		}
	}
}
