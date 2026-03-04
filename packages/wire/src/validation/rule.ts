import {
    FormatRegistry,
    Kind,
    type NumberOptions,
    type SchemaOptions,
    type StringOptions,
    type TSchema,
    Type,
} from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export type ValidationResult = {
    success: boolean;
    error?: string;
};

const SIMPLE_FORMATS: Array<{ name: string; check: (value: string) => boolean }> = [
    { name: "email", check: (value) => /^\S+@\S+\.\S+$/.test(value) },
    {
        name: "uri",
        check: (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
    },
    {
        name: "ipv4",
        check: (value) =>
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value),
    },
    {
        name: "ipv6",
        check: (value) =>
            /^(([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|([0-9A-Fa-f]{1,4}:){1,7}:|::1|::)$/.test(value),
    },
    {
        name: "uuid",
        check: (value) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    },
    {
        name: "date",
        check: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
    },
    {
        name: "date-time",
        check: (value) => !Number.isNaN(Date.parse(value)),
    },
];

for (const format of SIMPLE_FORMATS) {
    if (!FormatRegistry.Has(format.name)) {
        FormatRegistry.Set(format.name, format.check);
    }
}

function escapeRegexLiteral(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergePatterns(patterns: string[]): string | undefined {
    if (!patterns.length) return undefined;
    if (patterns.length === 1) return patterns[0];
    return `^(?=${patterns.join(")(?=")})[\\s\\S]*$`;
}

function parseRegexRule(raw?: string): string | undefined {
    if (!raw) return undefined;
    const s = raw.trim();

    if (s.startsWith("/") && s.lastIndexOf("/") > 0) {
        const last = s.lastIndexOf("/");
        return s.slice(1, last);
    }

    return s;
}

function buildStringDeclaration(parts: string[], defaultValue?: string): TSchema {
    const options: StringOptions & { default?: string } = {};
    if (defaultValue !== undefined) options.default = defaultValue;

    const patterns: string[] = [];

    for (const p of parts) {
        const [key, raw] = p.split(":", 2);
        const n = raw !== undefined ? Number(raw) : undefined;

        switch (key) {
            case "min":
                if (Number.isFinite(n!)) options.minLength = n!;
                break;
            case "max":
                if (Number.isFinite(n!)) options.maxLength = n!;
                break;
            case "between": {
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
            case "date":
                options.format = "date";
                break;
            case "date_time":
            case "datetime":
                options.format = "date-time";
                break;
            case "regex": {
                const rx = parseRegexRule(raw);
                if (rx) patterns.push(rx);
                break;
            }
            case "alpha":
                patterns.push("^[A-Za-z]+$");
                break;
            case "alpha_num":
                patterns.push("^[A-Za-z0-9]+$");
                break;
            case "alpha_dash":
                patterns.push("^[A-Za-z0-9_-]+$");
                break;
            case "ascii":
                patterns.push("^[\\x00-\\x7F]*$");
                break;
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
            case "ulid":
                patterns.push("^[0-9A-HJKMNP-TV-Z]{26}$");
                break;
            case "slug":
                patterns.push("^[a-z0-9]+(?:-[a-z0-9]+)*$");
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
        }
    }
}

function buildNumberDeclaration(parts: string[], defaultValue?: number): TSchema {
    const options: NumberOptions & { default?: number } = {};
    if (defaultValue !== undefined) options.default = defaultValue;
    applyNumericConstraints(parts, options);
    return Type.Number(options);
}

function buildIntegerDeclaration(parts: string[], defaultValue?: number): TSchema {
    const options: NumberOptions & { default?: number } = {};
    if (defaultValue !== undefined) options.default = defaultValue;
    applyNumericConstraints(parts, options);
    return Type.Integer(options);
}

function buildBooleanDeclaration(defaultValue?: boolean): TSchema {
    const options: SchemaOptions & { default?: boolean } = {};
    if (defaultValue !== undefined) options.default = defaultValue;
    return Type.Boolean(options);
}

function buildEnumDeclaration(values: string[], defaultValue?: string): TSchema {
    const options: SchemaOptions & { default?: string } = {};
    if (defaultValue !== undefined) options.default = defaultValue;
    return Type.Union(values.map((v) => Type.Literal(v)), options);
}

export function buildRuleSchema(rules: string, defaultValue?: unknown): TSchema {
    const parts = String(rules || "")
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);

    const isOptional = parts.includes("optional");
    const isNullable = parts.includes("nullable");
    const inRule = parts.find((p) => p.startsWith("in:"));
    let schema: TSchema;

    if (inRule) {
        const values = inRule
            .slice(3)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
        schema = buildEnumDeclaration(values, defaultValue as string | undefined);
    } else if (parts.includes("boolean") || parts.includes("bool")) {
        schema = buildBooleanDeclaration(defaultValue as boolean | undefined);
    } else if (parts.includes("integer") || parts.includes("int")) {
        schema = buildIntegerDeclaration(parts, defaultValue as number | undefined);
    } else if (parts.includes("number") || parts.includes("numeric")) {
        schema = buildNumberDeclaration(parts, defaultValue as number | undefined);
    } else {
        schema = buildStringDeclaration(parts, defaultValue as string | undefined);
    }

    if (isNullable) schema = Type.Union([schema, Type.Null()]);
    if (isOptional || isNullable) schema = Type.Optional(schema);

    return schema;
}

export type ComponentRuleDescriptor = {
    ruleStr: string;
    message?: string;
    schema: TSchema;
};

export function makeRuleDescriptor(ruleStr: string, message?: string): ComponentRuleDescriptor {
    return {
        ruleStr,
        message,
        schema: buildRuleSchema(ruleStr),
    };
}

export function isTypeBoxSchema(value: unknown): value is TSchema {
    return !!value && typeof value === "object" && Kind in (value as Record<string, unknown>);
}

export function isRequiredRule(ruleStr: string): boolean {
    const parts = String(ruleStr || "")
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);
    return parts.includes("required") || parts.includes("filled") || parts.includes("present");
}

export function isEmptyValidationValue(value: unknown): boolean {
    return value === undefined || value === null || value === "";
}

export function validateTypeBoxSchema(
    schema: TSchema,
    value: unknown,
    customMessage?: string,
): ValidationResult {
    if (Value.Check(schema, value)) {
        return { success: true };
    }

    if (customMessage) {
        return { success: false, error: customMessage };
    }

    const first = [...Value.Errors(schema, value)][0];
    return { success: false, error: first?.message || "Validation failed" };
}

export function validateRuleString(
    value: unknown,
    ruleStr: string,
    customMessage?: string,
): ValidationResult {
    const required = isRequiredRule(ruleStr);

    if (required && isEmptyValidationValue(value)) {
        return { success: false, error: customMessage || "The field is required." };
    }

    if (!required && isEmptyValidationValue(value)) {
        return { success: true };
    }

    const schema = buildRuleSchema(ruleStr);
    return validateTypeBoxSchema(schema, value, customMessage);
}
