import { Type, type TSchema } from "@sinclair/typebox";
import { buildRuleSchema } from "./validation/rule";

export type WireDefinition = {
	name: string;
	live?: boolean;
	page?: boolean;
};

export type WireVariableKind =
	| "string"
	| "number"
	| "integer"
	| "boolean"
	| "object"
	| "array"
	| "any"
	| "files"
	| "broadcast";

export type WireVariableDefinition = {
	name: string;
	raw: string;
	kind: WireVariableKind;
	isPrivate: boolean;
	optional: boolean;
	nullable: boolean;
	room?: string;
	minItems?: number;
	maxItems?: number;
	maxBytes?: number;
	schema?: TSchema;
	shapeRules?: Record<string, string>;
};

export type WireVariableShapeRules = Record<string, string>;
export type WireVariableInput =
	| string
	| {
			rules?: string;
			schema?: TSchema;
			shapeRules?: WireVariableShapeRules;
	  };

const wireDefinitionByClass = new WeakMap<Function, WireDefinition>();
const variableDefinitionByClass = new WeakMap<
	Function,
	Map<string, WireVariableDefinition>
>();

function parseIntSafe(value: string): number | undefined {
	const n = Number(value);
	if (!Number.isFinite(n)) return undefined;
	return Math.trunc(n);
}

function parseSizeToBytes(raw: string): number | undefined {
	const value = String(raw || "").trim().toLowerCase();
	if (!value) return undefined;
	const match = value.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);
	if (!match) return undefined;

	const amount = Number(match[1] || 0);
	if (!Number.isFinite(amount) || amount < 0) return undefined;

	const unit = String(match[2] || "b").toLowerCase();
	if (unit === "kb") return Math.round(amount * 1024);
	if (unit === "mb") return Math.round(amount * 1024 * 1024);
	if (unit === "gb") return Math.round(amount * 1024 * 1024 * 1024);
	return Math.round(amount);
}

function withOptionalAndNullable(
	schema: TSchema,
	optional: boolean,
	nullable: boolean,
) {
	let current = schema;
	if (nullable) current = Type.Union([current, Type.Null()]);
	if (optional || nullable) current = Type.Optional(current);
	return current;
}

function buildSchemaForKind(
	kind: WireVariableKind,
	tokens: string[],
	optional: boolean,
	nullable: boolean,
): TSchema | undefined {
	if (
		kind === "string" ||
		kind === "number" ||
		kind === "integer" ||
		kind === "boolean"
	) {
		return buildRuleSchema(tokens.join("|"));
	}

	if (kind === "array") {
		let minItems: number | undefined;
		let maxItems: number | undefined;
		for (let i = 0; i < tokens.length; i++) {
			const [key, raw] = tokens[i]!.split(":", 2);
			if (key === "min") minItems = parseIntSafe(raw || "");
			if (key === "max") maxItems = parseIntSafe(raw || "");
		}
		return withOptionalAndNullable(
			Type.Array(Type.Any(), {
				minItems,
				maxItems,
			}),
			optional,
			nullable,
		);
	}

	if (kind === "object") {
		return withOptionalAndNullable(
			Type.Object({}, { additionalProperties: true }),
			optional,
			nullable,
		);
	}

	if (kind === "any") {
		return withOptionalAndNullable(Type.Any(), optional, nullable);
	}

	return undefined;
}

function inferKindFromSchema(schema?: TSchema): WireVariableKind | undefined {
	if (!schema || typeof schema !== "object") return undefined;
	const raw = String((schema as any).type || "").trim().toLowerCase();
	if (raw === "string") return "string";
	if (raw === "number") return "number";
	if (raw === "integer") return "integer";
	if (raw === "boolean") return "boolean";
	if (raw === "array") return "array";
	if (raw === "object") return "object";
	return undefined;
}

function normalizeShapeRules(
	input?: WireVariableShapeRules,
): WireVariableShapeRules | undefined {
	if (!input || typeof input !== "object") return undefined;
	const out: WireVariableShapeRules = {};
	const entries = Object.entries(input);
	for (let i = 0; i < entries.length; i++) {
		const [path, rawRule] = entries[i]!;
		const key = String(path || "").trim();
		const rule = String(rawRule || "").trim();
		if (!key || !rule) continue;
		out[key] = rule;
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

export function parseVariableDefinition(
	name: string,
	rawRules: string,
	config: {
		schema?: TSchema;
		shapeRules?: WireVariableShapeRules;
	} = {},
): WireVariableDefinition {
	const tokens = String(rawRules || "")
		.split("|")
		.map((entry) => entry.trim())
		.filter(Boolean);

	const tokenSet = new Set(tokens);
	const isPrivate = tokenSet.has("private");
	const optional = tokenSet.has("optional");
	const nullable = tokenSet.has("nullable");

	let kind: WireVariableKind = "string";
	if (tokenSet.has("files")) kind = "files";
	else if (tokenSet.has("broadcast")) kind = "broadcast";
	else if (tokenSet.has("boolean") || tokenSet.has("bool")) kind = "boolean";
	else if (tokenSet.has("integer") || tokenSet.has("int")) kind = "integer";
	else if (tokenSet.has("number") || tokenSet.has("numeric")) kind = "number";
	else if (tokenSet.has("object")) kind = "object";
	else if (tokenSet.has("array")) kind = "array";
	else if (tokenSet.has("any")) kind = "any";
	else if (tokenSet.has("string")) kind = "string";
	else if (config.schema) kind = inferKindFromSchema(config.schema) || "any";

	let room: string | undefined;
	let minItems: number | undefined;
	let maxItems: number | undefined;
	let maxBytes: number | undefined;

	for (let i = 0; i < tokens.length; i++) {
		const [key, raw] = tokens[i]!.split(":", 2);
		if (kind === "broadcast" && key === "room") {
			const value = String(raw || "").trim();
			if (value) room = value;
		}

		if (kind === "files") {
			if (key === "min") minItems = parseIntSafe(raw || "");
			if (key === "max") maxItems = parseIntSafe(raw || "");
			if (key === "size") maxBytes = parseSizeToBytes(raw || "");
		}
	}

	const schema = config.schema
		? withOptionalAndNullable(config.schema, optional, nullable)
		: buildSchemaForKind(kind, tokens, optional, nullable);
	return {
		name,
		raw: String(rawRules || "").trim(),
		kind,
		isPrivate,
		optional,
		nullable,
		room,
		minItems,
		maxItems,
		maxBytes,
		schema,
		shapeRules: normalizeShapeRules(config.shapeRules),
	};
}

export function defineWireComponent(
	target: Function,
	input: string | Partial<WireDefinition> | undefined,
) {
	if (typeof target !== "function") return;
	const current = wireDefinitionByClass.get(target) || {
		name: target.name || "anonymous",
	};

	const next: WireDefinition =
		typeof input === "string"
			? {
					...current,
					name: String(input || "").trim() || current.name,
				}
			: {
					...current,
					...(input || {}),
					name:
						String(input?.name || "").trim() ||
						current.name ||
						target.name ||
						"anonymous",
				};

	wireDefinitionByClass.set(target, next);
}

export function getWireComponentDefinition(
	target: Function | undefined | null,
): WireDefinition | undefined {
	if (!target || typeof target !== "function") return undefined;
	return wireDefinitionByClass.get(target);
}

export function defineWireVariable(
	target: Function,
	property: string,
	input: WireVariableInput,
) {
	if (typeof target !== "function") return;
	const key = String(property || "").trim();
	if (!key) return;

	const normalized =
		typeof input === "string"
			? { rules: input }
			: {
					rules: String(input?.rules || "").trim() || "any",
					schema: input?.schema,
					shapeRules: input?.shapeRules,
				};

	let map = variableDefinitionByClass.get(target);
	if (!map) {
		map = new Map<string, WireVariableDefinition>();
		variableDefinitionByClass.set(target, map);
	}

	map.set(
		key,
		parseVariableDefinition(key, normalized.rules, {
			schema: normalized.schema,
			shapeRules: normalized.shapeRules,
		}),
	);
}

export function getOwnWireVariables(
	target: Function | undefined | null,
): Map<string, WireVariableDefinition> {
	if (!target || typeof target !== "function") return new Map();
	return new Map(variableDefinitionByClass.get(target) || []);
}

export function getWireVariables(
	target: Function | undefined | null,
): Map<string, WireVariableDefinition> {
	const out = new Map<string, WireVariableDefinition>();
	if (!target || typeof target !== "function") return out;

	let current: any = target;
	while (current && current !== Function.prototype) {
		const own = variableDefinitionByClass.get(current);
		if (own) {
			for (const [name, definition] of own.entries()) {
				if (!out.has(name)) out.set(name, definition);
			}
		}

		const proto = Object.getPrototypeOf(current.prototype);
		if (!proto || proto === Object.prototype) break;
		current = proto.constructor;
	}

	return out;
}
