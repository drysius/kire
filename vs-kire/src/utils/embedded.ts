export interface ParsedAttribute {
	tagName: string;
	name: string;
	nameStart: number;
	nameEnd: number;
	hasValue: boolean;
	value: string;
	valueStart: number;
	valueEnd: number;
	quote?: '"' | "'";
}

function isWhitespace(char: string | undefined): boolean {
	return !!char && /\s/.test(char);
}

function isNameBreak(char: string | undefined): boolean {
	return !char || /[\s=/>"'`]/.test(char);
}

function scanQuoted(
	text: string,
	start: number,
	quote: '"' | "'",
): { valueEnd: number } {
	let i = start;
	while (i < text.length) {
		const ch = text[i]!;
		const prev = i > 0 ? text[i - 1] : "";
		if (ch === quote && prev !== "\\") {
			return { valueEnd: i };
		}
		i++;
	}
	return { valueEnd: text.length };
}

function scanUnquoted(text: string, start: number): { valueEnd: number } {
	let i = start;
	let inQuote: string | null = null;
	let depthParen = 0;
	let depthBracket = 0;
	let depthBrace = 0;

	while (i < text.length) {
		const ch = text[i]!;
		const prev = i > 0 ? text[i - 1] : "";

		if (inQuote) {
			if (ch === inQuote && prev !== "\\") inQuote = null;
			i++;
			continue;
		}

		if (ch === '"' || ch === "'" || ch === "`") {
			inQuote = ch;
			i++;
			continue;
		}

		if (ch === "(") depthParen++;
		else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
		else if (ch === "[") depthBracket++;
		else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
		else if (ch === "{") depthBrace++;
		else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);

		const atTopLevel =
			depthParen === 0 && depthBracket === 0 && depthBrace === 0 && !inQuote;
		if (atTopLevel && (isWhitespace(ch) || ch === ">")) {
			break;
		}

		i++;
	}

	return { valueEnd: i };
}

export function extractTagAttributes(
	text: string,
	filter?: (name: string) => boolean,
): ParsedAttribute[] {
	const out: ParsedAttribute[] = [];
	let i = 0;

	while (i < text.length) {
		const ch = text[i]!;
		if (ch !== "<") {
			i++;
			continue;
		}

		if (text.startsWith("<!--", i)) {
			const endComment = text.indexOf("-->", i + 4);
			i = endComment === -1 ? text.length : endComment + 3;
			continue;
		}

		const next = text[i + 1];
		if (!next || next === "/" || next === "!" || next === "?") {
			i++;
			continue;
		}

		let cursor = i + 1;
		while (cursor < text.length && /[A-Za-z0-9:_-]/.test(text[cursor]!))
			cursor++;
		const tagName = text.slice(i + 1, cursor);
		if (!tagName) {
			i++;
			continue;
		}

		while (cursor < text.length) {
			while (cursor < text.length && isWhitespace(text[cursor])) cursor++;
			if (cursor >= text.length) break;

			const current = text[cursor]!;
			if (current === ">") {
				cursor++;
				break;
			}
			if (current === "/" && text[cursor + 1] === ">") {
				cursor += 2;
				break;
			}

			const nameStart = cursor;
			while (cursor < text.length && !isNameBreak(text[cursor])) cursor++;
			const name = text.slice(nameStart, cursor);
			const nameEnd = cursor;
			if (!name) {
				cursor++;
				continue;
			}

			while (cursor < text.length && isWhitespace(text[cursor])) cursor++;
			if (text[cursor] !== "=") {
				if (!filter || filter(name)) {
					out.push({
						tagName,
						name,
						nameStart,
						nameEnd,
						hasValue: false,
						value: "",
						valueStart: cursor,
						valueEnd: cursor,
					});
				}
				continue;
			}

			cursor++;
			while (cursor < text.length && isWhitespace(text[cursor])) cursor++;

			const valueStart = cursor;
			const first = text[cursor];

			if (first === '"' || first === "'") {
				const quote = first as '"' | "'";
				const contentStart = cursor + 1;
				const { valueEnd } = scanQuoted(text, contentStart, quote);
				const value = text.slice(contentStart, valueEnd);
				if (!filter || filter(name)) {
					out.push({
						tagName,
						name,
						nameStart,
						nameEnd,
						hasValue: true,
						value,
						valueStart: contentStart,
						valueEnd,
						quote,
					});
				}
				cursor = valueEnd < text.length ? valueEnd + 1 : valueEnd;
				continue;
			}

			const { valueEnd } = scanUnquoted(text, valueStart);
			const value = text.slice(valueStart, valueEnd);
			if (!filter || filter(name)) {
				out.push({
					tagName,
					name,
					nameStart,
					nameEnd,
					hasValue: true,
					value,
					valueStart,
					valueEnd,
				});
			}
			cursor = valueEnd;
		}

		i = Math.max(i + 1, cursor);
	}

	return out;
}

export function extractJsAttributeExpressions(text: string): ParsedAttribute[] {
	const attributes = extractTagAttributes(
		text,
		(name) =>
			name.startsWith(":") ||
			name.startsWith("@") ||
			name.startsWith("x-") ||
			name.startsWith("wire:"),
	).filter((attr) => attr.hasValue);

	const allAttributes = extractTagAttributes(text);
	for (const attr of allAttributes) {
		const forcedDynamic = toForcedDynamicComponentExpression(attr);
		if (forcedDynamic) {
			attributes.push(forcedDynamic);
		}
	}

	return attributes;
}

function toForcedDynamicComponentExpression(
	attr: ParsedAttribute,
): ParsedAttribute | null {
	if (!attr.quote) return null;
	if (!attr.tagName.startsWith("x-")) return null;
	if (
		attr.name.startsWith(":") ||
		attr.name.startsWith("@") ||
		attr.name.startsWith("x-") ||
		attr.name.startsWith("wire:")
	) {
		return null;
	}

	const raw = attr.value;
	const trimmed = raw.trim();
	if (
		!trimmed.startsWith("{") ||
		!trimmed.endsWith("}") ||
		trimmed.length <= 2
	) {
		return null;
	}

	const outerLeading = raw.length - raw.trimStart().length;
	const outerTrailing = raw.length - raw.trimEnd().length;
	const innerRaw = trimmed.slice(1, -1);
	const inner = innerRaw.trim();
	if (!inner) return null;

	const innerLeading = innerRaw.length - innerRaw.trimStart().length;
	const innerTrailing = innerRaw.length - innerRaw.trimEnd().length;

	return {
		...attr,
		value: inner,
		valueStart: attr.valueStart + outerLeading + 1 + innerLeading,
		valueEnd: attr.valueEnd - outerTrailing - 1 - innerTrailing,
	};
}
