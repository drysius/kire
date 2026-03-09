export interface ParamDefinition {
	name: string;
	type: string;
	tstype: string;
	optional?: boolean;
	rawDefinition: string;
	validate: (value: any) => ValidationResult;
}

export interface ValidationResult {
	valid: boolean;
	extracted?: Record<string, any>;
	error?: string;
}

type TypeChecker = (value: any) => boolean;
type ToolResolver = (ref: string) => string;

const TYPE_VALIDATORS: Record<string, TypeChecker> = {
	string: (value) => typeof value === "string",
	number: (value) => typeof value === "number" && Number.isFinite(value),
	boolean: (value) => typeof value === "boolean",
	any: () => true,
	unknown: () => true,
	object: (value) => typeof value === "object" && value !== null && !Array.isArray(value),
	array: (value) => Array.isArray(value),
	null: (value) => value === null,
	undefined: (value) => value === undefined,
	function: (value) => typeof value === "function",
};

export const validators = {
	register(type: string, validator: TypeChecker) {
		TYPE_VALIDATORS[type] = validator;
	},
	list() {
		return Object.keys(TYPE_VALIDATORS);
	},
};

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createPatternMatcher(pattern: string): (input: string) => Record<string, string> | null {
	let regex = "^";
	let i = 0;

	while (i < pattern.length) {
		if (pattern.startsWith("$...", i)) {
			regex += "(?<rest>.*)";
			i += 4;
			continue;
		}

		if (pattern[i] === "$") {
			const varStart = i + 1;
			let varEnd = varStart;
			while (varEnd < pattern.length && /\w/.test(pattern[varEnd])) varEnd++;
			if (varEnd === varStart) {
				regex += "\\$";
				i++;
				continue;
			}

			const varName = pattern.slice(varStart, varEnd);
			regex += `(?<${varName}>[^\\s]+)`;
			i = varEnd;
			continue;
		}

		if (pattern[i] === "{") {
			const end = pattern.indexOf("}", i);
			if (end !== -1) {
				const content = pattern.slice(i + 1, end);
				const colon = content.indexOf(":");
				if (colon !== -1) {
					const name = content.slice(0, colon).trim();
					const choices = content
						.slice(colon + 1)
						.split("/")
						.map((item) => escapeRegex(item.trim()))
						.join("|");
					regex += `(?<${name}>${choices})`;
				} else {
					const choices = content
						.split("/")
						.map((item) => escapeRegex(item.trim()))
						.join("|");
					regex += `(?:${choices})`;
				}
				i = end + 1;
				continue;
			}
		}

		const literalStart = i;
		while (i < pattern.length && pattern[i] !== " " && pattern[i] !== "$" && pattern[i] !== "{") i++;
		if (literalStart < i) regex += escapeRegex(pattern.slice(literalStart, i));
		if (i < pattern.length && pattern[i] === " ") {
			regex += "\\s+";
			i++;
			while (i < pattern.length && pattern[i] === " ") i++;
		}
	}

	regex += "$";
	const compiled = new RegExp(regex);

	return (input: string) => {
		if (typeof input !== "string") return null;
		const match = compiled.exec(input.trim());
		if (!match) return null;
		const result: Record<string, string> = {};
		for (const [key, value] of Object.entries(match.groups || {})) {
			if (value !== undefined) result[key] = value;
		}
		return result;
	};
}

function splitTopLevel(input: string, separator: string): string[] {
	const chunks: string[] = [];
	let current = "";
	let inQuote: string | null = null;
	let depthParen = 0;
	let depthBracket = 0;
	let depthBrace = 0;
	let depthAngle = 0;

	for (let i = 0; i < input.length; i++) {
		const ch = input[i]!;
		const prev = i > 0 ? input[i - 1] : "";

		if (inQuote) {
			current += ch;
			if (ch === inQuote && prev !== "\\") inQuote = null;
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
			ch === separator &&
			depthParen === 0 &&
			depthBracket === 0 &&
			depthBrace === 0 &&
			depthAngle === 0
		) {
			chunks.push(current.trim());
			current = "";
			continue;
		}

		current += ch;
	}

	if (current.trim()) chunks.push(current.trim());
	return chunks;
}

export function splitTopLevelArgs(input: string): string[] {
	return splitTopLevel(input, ",");
}

function findTopLevelColon(input: string): number {
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
		else if (
			ch === ":" &&
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

function parseObjectType(inner: string, resolveToolType?: ToolResolver): string {
	const fields = splitTopLevel(inner, ",")
		.map((rawField) => rawField.trim())
		.filter(Boolean)
		.map((rawField) => {
			const colon = findTopLevelColon(rawField);
			if (colon === -1) {
				return `${rawField}: any;`;
			}
			const rawName = rawField.slice(0, colon).trim();
			const fieldName = rawName.endsWith("?") ? rawName.slice(0, -1).trim() : rawName;
			const optional = rawName.endsWith("?");
			const rawType = rawField.slice(colon + 1).trim();
			const tsType = paramTypeToTs(rawType, resolveToolType);
			return `${fieldName}${optional ? "?" : ""}: ${tsType};`;
		});

	if (fields.length === 0) return "Record<string, any>";
	return `{ ${fields.join(" ")} }`;
}

export function paramTypeToTs(typeDef: string, resolveToolType?: ToolResolver): string {
	const raw = typeDef.trim();
	if (!raw) return "any";

	const unionParts = splitTopLevel(raw, "|");
	if (unionParts.length > 1) {
		return unionParts.map((part) => paramTypeToTs(part, resolveToolType)).join(" | ");
	}

	if (raw.startsWith("tools.")) {
		if (!resolveToolType) return "any";
		return resolveToolType(raw.slice("tools.".length));
	}

	if (raw.startsWith("object{") && raw.endsWith("}")) {
		return parseObjectType(raw.slice(7, -1), resolveToolType);
	}

	if (raw.startsWith("{") && raw.endsWith("}")) {
		return parseObjectType(raw.slice(1, -1), resolveToolType);
	}

	const arrayMatch = raw.match(/^array<([\s\S]+)>$/);
	if (arrayMatch?.[1]) {
		return `${paramTypeToTs(arrayMatch[1], resolveToolType)}[]`;
	}

	if (raw.endsWith("[]")) {
		return `${paramTypeToTs(raw.slice(0, -2), resolveToolType)}[]`;
	}

	switch (raw) {
		case "string":
		case "number":
		case "boolean":
		case "any":
		case "unknown":
		case "never":
			return raw;
		case "filepath":
		case "path":
			return "string";
		case "object":
			return "Record<string, any>";
		case "array":
			return "any[]";
		case "function":
			return "(...args: any[]) => any";
		default:
			return raw;
	}
}

function isLikelyPattern(input: string): boolean {
	return input.includes("$") || /\{[^}]*\/[^}]*\}/.test(input) || input.includes(" ");
}

export function isPatternDefinition(def: string): boolean {
	return isLikelyPattern(def);
}

export function parseParamDefinition(def: string): ParamDefinition {
	const trimmed = def.trim();
	const unionParts = splitTopLevel(trimmed, "|");

	if (unionParts.length > 1) {
		const branches = unionParts.map((part) => parseParamDefinition(part));
		const fallbackName = branches[0]?.name || "arg";
		return {
			name: fallbackName,
			type: branches.map((entry) => entry.type).join("|"),
			tstype: branches.map((entry) => entry.tstype).join(" | "),
			rawDefinition: def,
			validate: (value) => {
				const errors: string[] = [];
				for (const branch of branches) {
					const result = branch.validate(value);
					if (result.valid) return result;
					if (result.error) errors.push(result.error);
				}
				return {
					valid: false,
					error: errors.length > 0 ? errors.join(" OR ") : "No union branch matched",
				};
			},
		};
	}

	const colon = findTopLevelColon(trimmed);
	const hasTypedName = colon > 0;

	if (!hasTypedName && isLikelyPattern(trimmed)) {
		const matcher = createPatternMatcher(trimmed);
		return {
			name: "pattern_match",
			type: "pattern",
			tstype: "any",
			rawDefinition: def,
			validate: (value) => {
				if (typeof value !== "string") {
					return { valid: false, error: "Expected string for pattern parameter" };
				}
				const extracted = matcher(value);
				if (!extracted) {
					return { valid: false, error: `Pattern mismatch: ${trimmed}` };
				}
				return { valid: true, extracted };
			},
		};
	}

	let rawName = hasTypedName ? trimmed.slice(0, colon).trim() : trimmed;
	const rawType = hasTypedName ? trimmed.slice(colon + 1).trim() : "any";
	let optional = false;
	if (rawName.endsWith("?")) {
		rawName = rawName.slice(0, -1).trim();
		optional = true;
	}

	const name = rawName || "arg";
	if (isLikelyPattern(rawType)) {
		const matcher = createPatternMatcher(rawType);
		return {
			name,
			type: "pattern",
			tstype: "any",
			optional,
			rawDefinition: def,
			validate: (value) => {
				if (typeof value !== "string") {
					return { valid: false, error: "Expected string for pattern parameter" };
				}
				const extracted = matcher(value);
				if (!extracted) {
					return { valid: false, error: `Pattern mismatch: ${rawType}` };
				}
				return { valid: true, extracted };
			},
		};
	}

	const cleanType = rawType || "any";
	const tsType = paramTypeToTs(cleanType);
	const validator = TYPE_VALIDATORS[cleanType] || (cleanType.startsWith("object{") || cleanType.startsWith("{")
		? TYPE_VALIDATORS.object
		: cleanType.startsWith("array<") || cleanType.endsWith("[]")
			? TYPE_VALIDATORS.array
			: TYPE_VALIDATORS.any);

	return {
		name,
		type: cleanType,
		tstype: tsType,
		optional,
		rawDefinition: def,
		validate: (value) =>
			validator(value)
				? { valid: true }
				: { valid: false, error: `Expected ${cleanType}, got ${typeof value}` },
	};
}
