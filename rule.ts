// rule.ts
import {
	type NumberOptions,
	type SchemaOptions,
	type StringOptions,
	type TBoolean,
	type TInteger,
	type TLiteral,
	type TNumber,
	type TOptional,
	type TSchema,
	type TString,
	type TUnion,
	Type,
} from "@sinclair/typebox";

/* -------------------------------------------------------------------------------------------------
 * Type-level parser (inferência por string literal)
 * ------------------------------------------------------------------------------------------------- */

type HasToken<TRules extends string, TToken extends string> = TRules extends
	| `${TToken}`
	| `${TToken}|${string}`
	| `${string}|${TToken}`
	| `${string}|${TToken}|${string}`
	? true
	: false;

type AfterIn<TRules extends string> =
	TRules extends `${string}|in:${infer Tail}`
		? Tail
		: TRules extends `in:${infer Tail}`
			? Tail
			: never;

type TakeUntilPipe<S extends string> = S extends `${infer Head}|${string}`
	? Head
	: S;

type InValues<TRules extends string> =
	AfterIn<TRules> extends infer Tail extends string
		? TakeUntilPipe<Tail>
		: never;

type SplitComma<S extends string> = S extends `${infer A},${infer B}`
	? A | SplitComma<B>
	: S;

type IsEnum<TRules extends string> = [AfterIn<TRules>] extends [never]
	? false
	: true;

type IsOptional<TRules extends string> =
	HasToken<TRules, "optional"> extends true
		? true
		: HasToken<TRules, "nullable"> extends true
			? true
			: false;

type BaseSchema<TRules extends string> =
	IsEnum<TRules> extends true
		? TUnion<TLiteral<SplitComma<InValues<TRules>>>[]>
		: HasToken<TRules, "boolean"> extends true
			? TBoolean
			: HasToken<TRules, "integer"> extends true
				? TInteger
				: HasToken<TRules, "int"> extends true
					? TInteger
					: HasToken<TRules, "number"> extends true
						? TNumber
						: HasToken<TRules, "numeric"> extends true
							? TNumber
							: TString;

type WithOptional<
	TRules extends string,
	S extends TSchema,
> = IsOptional<TRules> extends true ? TOptional<S> : S;

/** Schema inferido (quando TRules é literal). */
export type RuleSchema<TRules extends string> = WithOptional<
	TRules,
	BaseSchema<TRules>
>;

/** Fallback quando TRules é `string` amplo (dinâmico). */
export type RuleSchemaFor<TRules extends string> = string extends TRules
	? TSchema
	: RuleSchema<TRules>;

/** Tipo do default coerente com as rules (quando literal). */
export type RuleValue<TRules extends string> =
	IsEnum<TRules> extends true
		? SplitComma<InValues<TRules>>
		: HasToken<TRules, "boolean"> extends true
			? boolean
			: HasToken<TRules, "integer"> extends true
				? number
				: HasToken<TRules, "int"> extends true
					? number
					: HasToken<TRules, "number"> extends true
						? number
						: HasToken<TRules, "numeric"> extends true
							? number
							: string;

export type RuleDefault<TRules extends string> = string extends TRules
	? unknown
	: RuleValue<TRules>;

/* -------------------------------------------------------------------------------------------------
 * Declarações “fragmentadas” por tipo
 * ------------------------------------------------------------------------------------------------- */

export type StringDeclaration<TRules extends string = ""> = WithOptional<
	TRules,
	TString
>;
export type NumberDeclaration<TRules extends string = ""> = WithOptional<
	TRules,
	TNumber
>;
export type IntegerDeclaration<TRules extends string = ""> = WithOptional<
	TRules,
	TInteger
>;
export type BooleanDeclaration<TRules extends string = ""> = WithOptional<
	TRules,
	TBoolean
>;

export type EnumDeclaration<TRules extends string> = WithOptional<
	TRules,
	TUnion<TLiteral<SplitComma<InValues<TRules>>>[]>
>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------------------------------- */

function escapeRegexLiteral(input: string): string {
	// escape básico para montar regex a partir de texto literal
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergePatterns(patterns: string[]): string | undefined {
	if (!patterns.length) return undefined;
	if (patterns.length === 1) return patterns[0];
	// Interseção via lookaheads (bom o suficiente p/ maioria dos casos)
	// Nota: se um pattern usar flags (ex: (?i)), isso depende do engine.
	return `^(?=${patterns.join(")(?=")})[\\s\\S]*$`;
}

function parseRegexRule(raw?: string): string | undefined {
	if (!raw) return undefined;
	const s = raw.trim();

	// aceita regex:/.../flags ou regex:...
	if (s.startsWith("/") && s.lastIndexOf("/") > 0) {
		const last = s.lastIndexOf("/");
		const body = s.slice(1, last);
		// flags ignoradas (JSON Schema pattern não suporta flags)
		return body;
	}

	return s;
}

/* -------------------------------------------------------------------------------------------------
 * Runtime builders
 * ------------------------------------------------------------------------------------------------- */

function buildStringDeclaration(
	parts: string[],
	defaultValue?: string,
): TString {
	const options: StringOptions & { default?: string } = {};
	if (defaultValue !== undefined) options.default = defaultValue;

	const patterns: string[] = [];

	for (const p of parts) {
		const [key, raw] = p.split(":", 2);
		const n = raw !== undefined ? Number(raw) : undefined;

		switch (key) {
			// tamanhos
			case "min":
				if (Number.isFinite(n!)) options.minLength = n!;
				break;
			case "max":
				if (Number.isFinite(n!)) options.maxLength = n!;
				break;
			case "between": {
				// between:min,max (string length)
				const [a, b] = (raw ?? "").split(",").map((x) => Number(x));
				if (Number.isFinite(a)) options.minLength = a;
				if (Number.isFinite(b)) options.maxLength = b;
				break;
			}
			case "size":
			case "len":
			case "length":
				if (Number.isFinite(n!)) {
					options.minLength = n!;
					options.maxLength = n!;
				}
				break;

			// formatos comuns
			case "email":
				options.format = "email";
				break;
			case "url":
			case "uri":
				options.format = "uri";
				break;
			case "ipv4":
				options.format = "ipv4";
				break;
			case "ipv6":
				options.format = "ipv6";
				break;
			case "uuid":
				options.format = "uuid";
				break;

			// formatos extras "laravel-like"
			case "date":
				options.format = "date";
				break;
			case "date_time":
			case "datetime":
				options.format = "date-time";
				break;

			// regex
			case "regex": {
				const rx = parseRegexRule(raw);
				if (rx) patterns.push(rx);
				break;
			}

			// letras/números
			case "alpha":
				patterns.push("^[A-Za-z]+$");
				break;
			case "alpha_num":
				patterns.push("^[A-Za-z0-9]+$");
				break;
			case "alpha_dash":
				// Laravel alpha_dash: letras, números, hífen e underscore
				patterns.push("^[A-Za-z0-9_-]+$");
				break;
			case "ascii":
				patterns.push("^[\\x00-\\x7F]*$");
				break;

			// start/end
			case "starts_with": {
				const list = (raw ?? "")
					.split(",")
					.map((x) => x.trim())
					.filter(Boolean)
					.map(escapeRegexLiteral);
				if (list.length) patterns.push(`^(?:${list.join("|")})`);
				break;
			}
			case "ends_with": {
				const list = (raw ?? "")
					.split(",")
					.map((x) => x.trim())
					.filter(Boolean)
					.map(escapeRegexLiteral);
				if (list.length) patterns.push(`(?:${list.join("|")})$`);
				break;
			}

			// dígitos
			case "digits":
				if (Number.isFinite(n!)) patterns.push(`^\\d{${n!}}$`);
				break;
			case "digits_between": {
				const [a, b] = (raw ?? "").split(",").map((x) => Number(x));
				if (Number.isFinite(a) && Number.isFinite(b)) {
					patterns.push(`^\\d{${a},${b}}$`);
				}
				break;
			}

			// caixa
			case "lowercase":
				patterns.push("^[a-z0-9\\s\\p{P}]*$");
				break;
			case "uppercase":
				patterns.push("^[A-Z0-9\\s\\p{P}]*$");
				break;

			// utilitários comuns
			case "ulid":
				// Crockford Base32 (sem I,L,O,U)
				patterns.push("^[0-9A-HJKMNP-TV-Z]{26}$");
				break;
			case "slug":
				// aproximação comum
				patterns.push("^[a-z0-9]+(?:-[a-z0-9]+)*$");
				break;

			// presence rules que não mudam o schema aqui
			case "required":
			case "filled":
			case "present":
			case "sometimes":
			case "string":
			case "text":
				break;
		}
	}

	const merged = mergePatterns(patterns);
	if (merged) options.pattern = merged;

	return Type.String(options);
}

function applyNumericConstraints(parts: string[], options: NumberOptions) {
	for (const p of parts) {
		const [key, raw] = p.split(":", 2);
		const n = raw !== undefined ? Number(raw) : undefined;

		switch (key) {
			case "min":
				if (Number.isFinite(n!)) options.minimum = n!;
				break;
			case "max":
				if (Number.isFinite(n!)) options.maximum = n!;
				break;
			case "between": {
				const [a, b] = (raw ?? "").split(",").map((x) => Number(x));
				if (Number.isFinite(a)) options.minimum = a;
				if (Number.isFinite(b)) options.maximum = b;
				break;
			}
			case "gt":
				if (Number.isFinite(n!)) options.exclusiveMinimum = n!;
				break;
			case "gte":
				if (Number.isFinite(n!)) options.minimum = n!;
				break;
			case "lt":
				if (Number.isFinite(n!)) options.exclusiveMaximum = n!;
				break;
			case "lte":
				if (Number.isFinite(n!)) options.maximum = n!;
				break;
			case "multiple_of":
				if (Number.isFinite(n!) && n! !== 0) options.multipleOf = n!;
				break;

			// presence/type rules que não mudam constraints
			case "number":
			case "numeric":
			case "integer":
			case "int":
			case "required":
			case "filled":
			case "present":
			case "sometimes":
				break;
		}
	}
}

function buildNumberDeclaration(
	parts: string[],
	defaultValue?: number,
): TNumber {
	const options: NumberOptions & { default?: number } = {};
	if (defaultValue !== undefined) options.default = defaultValue;

	applyNumericConstraints(parts, options);
	return Type.Number(options);
}

function buildIntegerDeclaration(
	parts: string[],
	defaultValue?: number,
): TInteger {
	const options: NumberOptions & { default?: number } = {};
	if (defaultValue !== undefined) options.default = defaultValue;

	applyNumericConstraints(parts, options);
	return Type.Integer(options);
}

function buildBooleanDeclaration(defaultValue?: boolean): TBoolean {
	const options: SchemaOptions & { default?: boolean } = {};
	if (defaultValue !== undefined) options.default = defaultValue;
	return Type.Boolean(options);
}

function buildEnumDeclaration(
	values: string[],
	defaultValue?: string,
): TUnion<TLiteral<string>[]> {
	const options: SchemaOptions & { default?: string } = {};
	if (defaultValue !== undefined) options.default = defaultValue;

	return Type.Union(
		values.map((v) => Type.Literal(v)),
		options,
	) as TUnion<TLiteral<string>[]>;
}

/* -------------------------------------------------------------------------------------------------
 * rule() com overloads tipados
 * ------------------------------------------------------------------------------------------------- */

export function rule<TRules extends string>(
	rules: TRules,
): RuleSchemaFor<TRules>;
export function rule<TRules extends string>(
	rules: TRules,
	defaultValue: RuleDefault<TRules>,
): RuleSchemaFor<TRules>;

export function rule(rules: string, defaultValue?: unknown): TSchema {
	const parts = rules
		.split("|")
		.map((p) => p.trim())
		.filter(Boolean);

	const isOptional = parts.includes("optional") || parts.includes("nullable");

	// "in:" manda no tipo (Enum)
	const inRule = parts.find((p) => p.startsWith("in:"));
	let schema: TSchema;

	if (inRule) {
		const values = inRule
			.slice(3)
			.split(",")
			.map((v) => v.trim())
			.filter(Boolean);
		schema = buildEnumDeclaration(values, defaultValue as string | undefined);
	} else if (parts.includes("boolean")) {
		schema = buildBooleanDeclaration(defaultValue as boolean | undefined);
	} else if (parts.includes("integer") || parts.includes("int")) {
		schema = buildIntegerDeclaration(parts, defaultValue as number | undefined);
	} else if (parts.includes("number") || parts.includes("numeric")) {
		schema = buildNumberDeclaration(parts, defaultValue as number | undefined);
	} else {
		// default: string/text
		schema = buildStringDeclaration(parts, defaultValue as string | undefined);
	}

	return isOptional ? Type.Optional(schema) : schema;
}
