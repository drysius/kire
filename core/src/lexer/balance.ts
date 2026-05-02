/**
 * Pure functions for balanced bracket/quote scanning.
 * No external dependencies — fully testable in isolation.
 */

export interface BracketResult {
	content: string;
	fullLength: number;
}

/**
 * Finds the closing delimiter of an interpolation expression.
 * Respects nested brackets and string literals (including backslash escapes).
 *
 * @returns Index of the start of `close`, or -1 if not found.
 */
export function findInterpolationEnd(
	template: string,
	from: number,
	close: string,
): number {
	let inQuote: string | null = null;
	let escaped = false;
	let depthParen = 0;
	let depthBracket = 0;
	let depthBrace = 0;

	for (let i = from; i < template.length; i++) {
		const char = template[i]!;

		// Only check for the closing delimiter at depth zero, outside strings
		if (
			!inQuote &&
			depthParen === 0 &&
			depthBracket === 0 &&
			depthBrace === 0 &&
			template.startsWith(close, i)
		) {
			return i;
		}

		if (inQuote) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (char === "\\") {
				escaped = true;
				continue;
			}
			if (char === inQuote) inQuote = null;
			continue;
		}

		if (char === '"' || char === "'" || char === "`") {
			inQuote = char;
			continue;
		}

		// Guard depth against going negative — malformed input won't misparse
		if (char === "(") depthParen++;
		else if (char === ")" && depthParen > 0) depthParen--;
		else if (char === "[") depthBracket++;
		else if (char === "]" && depthBracket > 0) depthBracket--;
		else if (char === "{") depthBrace++;
		else if (char === "}" && depthBrace > 0) depthBrace--;
	}

	return -1;
}

/**
 * Extracts the inner content between a matching pair of brackets.
 * Handles nested brackets and properly tracks escape sequences inside strings.
 *
 * @returns The content (without the surrounding brackets) and the total span consumed,
 *          or null if the bracket pair is unclosed.
 */
export function extractBracketedContent(
	template: string,
	cursor: number,
	open: string,
	close: string,
): BracketResult | null {
	let depth = 0;
	let content = "";
	let inQuote: string | null = null;
	let escaped = false;
	const len = template.length;

	for (let i = cursor; i < len; i++) {
		const char = template[i]!;

		if (inQuote) {
			if (escaped) {
				escaped = false;
			} else if (char === "\\") {
				escaped = true;
			} else if (char === inQuote) {
				inQuote = null;
			}
		} else {
			if (char === '"' || char === "'" || char === "`") {
				inQuote = char;
			} else if (char === open) {
				depth++;
			} else if (char === close) {
				depth--;
			}
		}

		content += char;

		if (depth === 0) {
			// content includes the outer brackets; strip them for the return value
			return { content: content.slice(1, -1), fullLength: i - cursor + 1 };
		}
	}

	return null;
}

/**
 * Splits a comma-separated argument string into individual trimmed arguments.
 * Respects nested brackets and string literals, including backslash escapes.
 */
export function parseArgs(argsStr: string): string[] {
	const args: string[] = [];
	let current = "";
	let dPar = 0;
	let dBra = 0;
	let dCur = 0;
	let inQ: string | null = null;
	let escaped = false;

	for (let i = 0; i < argsStr.length; i++) {
		const c = argsStr[i]!;

		if (inQ) {
			if (escaped) {
				escaped = false;
			} else if (c === "\\") {
				escaped = true;
			} else if (c === inQ) {
				inQ = null;
			}
		} else {
			if (c === '"' || c === "'" || c === "`") {
				inQ = c;
			} else if (c === "(") dPar++;
			else if (c === ")") dPar--;
			else if (c === "[") dBra++;
			else if (c === "]") dBra--;
			else if (c === "{") dCur++;
			else if (c === "}") dCur--;
			else if (c === "," && dPar === 0 && dBra === 0 && dCur === 0) {
				args.push(current.trim());
				current = "";
				continue;
			}
		}

		current += c;
	}

	if (current.trim() || args.length > 0) args.push(current.trim());
	return args;
}
