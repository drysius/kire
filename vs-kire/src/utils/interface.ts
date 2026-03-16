import type { DirectiveCall } from "../core/directiveScan";

export interface InterfaceVariableInfo {
	type: string;
	description?: string;
}

export interface InterfaceContext {
	thisType?: string;
	vars: Map<string, InterfaceVariableInfo>;
}

export interface InterfaceDirectiveContexts {
	local: InterfaceContext;
	global: InterfaceContext;
}

export function createInterfaceContext(): InterfaceContext {
	return { vars: new Map() };
}

export function mergeType(
	existing: string | undefined,
	incoming: string | undefined,
): string | undefined {
	const next = incoming?.trim();
	if (!next) return existing;
	if (!existing || !existing.trim()) return next;
	if (existing.trim() === next) return existing.trim();
	return `(${existing.trim()}) & (${next})`;
}

export function mergeInterfaceContext(
	target: InterfaceContext,
	source: InterfaceContext,
) {
	target.thisType = mergeType(target.thisType, source.thisType);
	for (const [name, info] of source.vars.entries()) {
		const existing = target.vars.get(name);
		target.vars.set(name, {
			type: mergeType(existing?.type, info.type) || info.type,
			description: existing?.description || info.description,
		});
	}
}

export function hasInterfaceContext(context: InterfaceContext): boolean {
	return !!context.thisType?.trim() || context.vars.size > 0;
}

export function serializeInterfaceContext(context: InterfaceContext): string {
	const vars = Array.from(context.vars.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(
			([name, info]) =>
				`${name}:${info.type}${info.description ? `#${info.description}` : ""}`,
		)
		.join("|");
	return `${context.thisType?.trim() || ""}::${vars}`;
}

function isValidVariableName(name: string): boolean {
	return /^[$A-Z_a-z][$\w]*$/.test(name);
}

function normalizeObjectKey(raw: string): string | undefined {
	let key = raw.trim();
	if (!key) return undefined;
	if (key.startsWith("[")) return undefined;

	if (key.endsWith("?")) {
		key = key.slice(0, -1).trim();
	}

	if (
		(key.startsWith('"') && key.endsWith('"')) ||
		(key.startsWith("'") && key.endsWith("'")) ||
		(key.startsWith("`") && key.endsWith("`"))
	) {
		key = key.slice(1, -1).trim();
	}

	return isValidVariableName(key) ? key : undefined;
}

function findTopLevelChar(input: string, target: string): number {
	let inQuote: string | null = null;
	let depthParen = 0;
	let depthBracket = 0;
	let depthBrace = 0;
	let depthAngle = 0;

	for (let i = 0; i < input.length; i++) {
		const ch = input[i]!;
		const prev = i > 0 ? input[i - 1] : "";

		if (inQuote) {
			if (ch === inQuote && prev !== "\\") inQuote = null;
			continue;
		}

		if (ch === '"' || ch === "'" || ch === "`") {
			inQuote = ch;
			continue;
		}

		if (ch === "(") depthParen++;
		else if (ch === ")") depthParen--;
		else if (ch === "[") depthBracket++;
		else if (ch === "]") depthBracket--;
		else if (ch === "{") depthBrace++;
		else if (ch === "}") depthBrace--;
		else if (ch === "<") depthAngle++;
		else if (ch === ">") depthAngle--;

		if (
			ch === target &&
			depthParen === 0 &&
			depthBracket === 0 &&
			depthBrace === 0 &&
			depthAngle === 0
		) {
			return i;
		}
	}

	return -1;
}

function normalizeCommentText(raw: string): string {
	return raw
		.replace(/^\/\*+/, "")
		.replace(/\*+\/$/, "")
		.replace(/^\/\//, "")
		.split("\n")
		.map((line) => line.replace(/^\s*\*\s?/, "").trim())
		.filter(Boolean)
		.join(" ")
		.trim();
}

function splitInterfaceFields(input: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuote: string | null = null;
	let depthParen = 0;
	let depthBracket = 0;
	let depthBrace = 0;
	let depthAngle = 0;
	let inLineComment = false;
	let inBlockComment = false;

	for (let i = 0; i < input.length; i++) {
		const ch = input[i]!;
		const next = i + 1 < input.length ? input[i + 1]! : "";
		const prev = i > 0 ? input[i - 1]! : "";

		if (inLineComment) {
			current += ch;
			if (ch === "\n") inLineComment = false;
			continue;
		}

		if (inBlockComment) {
			current += ch;
			if (prev === "*" && ch === "/") inBlockComment = false;
			continue;
		}

		if (inQuote) {
			current += ch;
			if (ch === inQuote && prev !== "\\") inQuote = null;
			continue;
		}

		if (ch === "/" && next === "/") {
			current += "//";
			inLineComment = true;
			i++;
			continue;
		}

		if (ch === "/" && next === "*") {
			current += "/*";
			inBlockComment = true;
			i++;
			continue;
		}

		if (ch === '"' || ch === "'" || ch === "`") {
			inQuote = ch;
			current += ch;
			continue;
		}

		if (ch === "(") depthParen++;
		else if (ch === ")") depthParen--;
		else if (ch === "[") depthBracket++;
		else if (ch === "]") depthBracket--;
		else if (ch === "{") depthBrace++;
		else if (ch === "}") depthBrace--;
		else if (ch === "<") depthAngle++;
		else if (ch === ">") depthAngle--;

		if (
			ch === "," &&
			depthParen === 0 &&
			depthBracket === 0 &&
			depthBrace === 0 &&
			depthAngle === 0
		) {
			if (current.trim()) fields.push(current.trim());
			current = "";
			continue;
		}

		current += ch;
	}

	if (current.trim()) fields.push(current.trim());
	return fields;
}

function consumeLeadingDescription(input: string): {
	value: string;
	description?: string;
} {
	let rest = input.trim();
	const parts: string[] = [];

	while (rest.startsWith("/*") || rest.startsWith("//")) {
		if (rest.startsWith("/*")) {
			const end = rest.indexOf("*/");
			if (end === -1) break;
			parts.push(normalizeCommentText(rest.slice(0, end + 2)));
			rest = rest.slice(end + 2).trimStart();
			continue;
		}

		const newline = rest.indexOf("\n");
		if (newline === -1) {
			parts.push(normalizeCommentText(rest));
			rest = "";
			break;
		}

		parts.push(normalizeCommentText(rest.slice(0, newline)));
		rest = rest.slice(newline + 1).trimStart();
	}

	return {
		value: rest,
		description: parts.filter(Boolean).join(" ").trim() || undefined,
	};
}

function consumeTrailingDescription(input: string): {
	value: string;
	description?: string;
} {
	const trimmed = input.trim();
	const blockMatch = /^(.*?)(\/\*[\s\S]*\*\/)\s*$/.exec(trimmed);
	if (blockMatch) {
		return {
			value: blockMatch[1]!.trim(),
			description: normalizeCommentText(blockMatch[2]!),
		};
	}

	const lineCommentIndex = trimmed.lastIndexOf("//");
	if (lineCommentIndex >= 0) {
		return {
			value: trimmed.slice(0, lineCommentIndex).trim(),
			description: normalizeCommentText(trimmed.slice(lineCommentIndex)),
		};
	}

	return { value: trimmed };
}

function parseInterfaceObjectLiteral(
	raw: string,
): Map<string, InterfaceVariableInfo> {
	const vars = new Map<string, InterfaceVariableInfo>();
	const trimmed = raw.trim();
	if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return vars;

	const body = trimmed.slice(1, -1).trim();
	if (!body) return vars;

	const fields = splitInterfaceFields(body);
	for (const fieldRaw of fields) {
		const leading = consumeLeadingDescription(fieldRaw);
		const field = leading.value.trim();
		if (!field || field.startsWith("...")) continue;

		const colon = findTopLevelChar(field, ":");
		if (colon === -1) continue;

		const key = normalizeObjectKey(field.slice(0, colon));
		if (!key) continue;

		const trailing = consumeTrailingDescription(field.slice(colon + 1));
		const typeExpr = trailing.value.trim();
		if (!typeExpr) continue;
		vars.set(key, {
			type: typeExpr,
			description: leading.description || trailing.description,
		});
	}

	return vars;
}

function parseBooleanLiteral(raw?: string): boolean {
	if (!raw) return false;
	const value = raw.trim();
	if (!value) return false;
	if (value === "true" || value === "1") return true;
	if (value === '"true"' || value === "'true'") return true;
	return false;
}

function parseInterfaceTarget(raw?: string): InterfaceContext {
	const context = createInterfaceContext();
	if (!raw) return context;

	const trimmed = raw.trim();
	if (!trimmed) return context;

	if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
		const vars = parseInterfaceObjectLiteral(trimmed);
		for (const [name, info] of vars.entries()) {
			context.vars.set(name, info);
		}
		return context;
	}

	context.thisType = trimmed;
	return context;
}

export function extractInterfaceContextsFromDirectives(
	directives: DirectiveCall[],
): InterfaceDirectiveContexts {
	const local = createInterfaceContext();
	const global = createInterfaceContext();

	for (const directive of directives) {
		if (directive.name !== "interface") continue;
		if (directive.args.length === 0) continue;

		const target = parseInterfaceTarget(directive.args[0]?.value);
		const useGlobal = parseBooleanLiteral(directive.args[1]?.value);
		if (useGlobal) {
			mergeInterfaceContext(global, target);
			continue;
		}
		mergeInterfaceContext(local, target);
	}

	return { local, global };
}
