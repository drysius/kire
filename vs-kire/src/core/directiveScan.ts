export interface DirectiveArgSpan {
	value: string;
	start: number;
	end: number;
}

export interface DirectiveCall {
	name: string;
	start: number;
	end: number;
	args: DirectiveArgSpan[];
}

function isDirectiveNameChar(char: string) {
	return /[a-zA-Z0-9_.:-]/.test(char);
}

function parseBracketContent(text: string, openIndex: number) {
	let depth = 0;
	let inQuote: string | null = null;

	for (let i = openIndex; i < text.length; i++) {
		const char = text[i]!;
		const prev = i > 0 ? text[i - 1] : "";

		if (inQuote) {
			if (char === inQuote && prev !== "\\") inQuote = null;
			continue;
		}

		if (char === "'" || char === '"' || char === "`") {
			inQuote = char;
			continue;
		}

		if (char === "(") depth++;
		if (char === ")") depth--;

		if (depth === 0) {
			return {
				content: text.slice(openIndex + 1, i),
				end: i,
			};
		}
	}

	return null;
}

function splitArgs(content: string, offset: number): DirectiveArgSpan[] {
	const args: DirectiveArgSpan[] = [];
	let start = 0;
	let depthParen = 0;
	let depthBrace = 0;
	let depthBracket = 0;
	let depthAngle = 0;
	let inQuote: string | null = null;

	for (let i = 0; i < content.length; i++) {
		const char = content[i]!;
		const prev = i > 0 ? content[i - 1] : "";

		if (inQuote) {
			if (char === inQuote && prev !== "\\") inQuote = null;
			continue;
		}

		if (char === "'" || char === '"' || char === "`") {
			inQuote = char;
			continue;
		}

		if (char === "(") depthParen++;
		else if (char === ")") depthParen--;
		else if (char === "{") depthBrace++;
		else if (char === "}") depthBrace--;
		else if (char === "[") depthBracket++;
		else if (char === "]") depthBracket--;
		else if (char === "<") depthAngle++;
		else if (char === ">") depthAngle--;

		if (
			char === "," &&
			depthParen === 0 &&
			depthBrace === 0 &&
			depthBracket === 0 &&
			depthAngle === 0
		) {
			const raw = content.slice(start, i);
			const value = raw.trim();
			if (value) {
				const leftTrim = raw.length - raw.trimStart().length;
				const rightTrim = raw.length - raw.trimEnd().length;
				args.push({
					value,
					start: offset + start + leftTrim,
					end: offset + i - rightTrim,
				});
			}
			start = i + 1;
		}
	}

	const tail = content.slice(start);
	const value = tail.trim();
	if (value) {
		const leftTrim = tail.length - tail.trimStart().length;
		const rightTrim = tail.length - tail.trimEnd().length;
		args.push({
			value,
			start: offset + start + leftTrim,
			end: offset + content.length - rightTrim,
		});
	}

	return args;
}

const RAW_BLOCK_OPENERS: Array<{ open: RegExp; close: string }> = [
	{ open: /^<style\b[^>]*>/i, close: "</style>" },
	{ open: /^<script\b[^>]*>/i, close: "</script>" },
];

/**
 * Returns the index right after a region that must not be scanned for
 * directives (HTML comments, Kire comments, <style> and <script> bodies),
 * or -1 when `i` is not at the start of such a region.
 */
function skipNonDirectiveRegion(text: string, i: number): number {
	if (text.startsWith("<!--", i)) {
		const end = text.indexOf("-->", i + 4);
		return end === -1 ? text.length : end + 3;
	}
	if (text.startsWith("{{--", i)) {
		const end = text.indexOf("--}}", i + 4);
		return end === -1 ? text.length : end + 4;
	}
	if (text[i] === "<") {
		for (const { open, close } of RAW_BLOCK_OPENERS) {
			const m = open.exec(text.slice(i, i + 512));
			if (!m) continue;
			const bodyStart = i + m[0].length;
			const end = text.toLowerCase().indexOf(close, bodyStart);
			return end === -1 ? text.length : end + close.length;
		}
	}
	return -1;
}

export function scanDirectives(text: string): DirectiveCall[] {
	const calls: DirectiveCall[] = [];

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch === "<" || ch === "{") {
			const skipTo = skipNonDirectiveRegion(text, i);
			if (skipTo !== -1) {
				i = skipTo - 1;
				continue;
			}
		}
		if (ch !== "@") continue;
		if (text[i + 1] === "@") {
			i++;
			continue;
		}

		let cursor = i + 1;
		while (cursor < text.length && isDirectiveNameChar(text[cursor]!)) cursor++;
		if (cursor === i + 1) continue;

		const name = text.slice(i + 1, cursor);
		while (cursor < text.length && /\s/.test(text[cursor]!)) cursor++;

		if (text[cursor] === "(") {
			const bracket = parseBracketContent(text, cursor);
			if (!bracket) {
				calls.push({ name, start: i, end: cursor, args: [] });
				continue;
			}

			const args = splitArgs(bracket.content, cursor + 1);
			calls.push({
				name,
				start: i,
				end: bracket.end,
				args,
			});
			i = bracket.end;
			continue;
		}

		calls.push({ name, start: i, end: cursor, args: [] });
		i = cursor - 1;
	}

	return calls;
}
