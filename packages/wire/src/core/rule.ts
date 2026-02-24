import {
    type NumberOptions,
    type StringOptions,
    type TSchema,
    Type,
    FormatRegistry
} from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { MIMEType } from "node:util";

export interface ValidationResult {
    success: boolean;
    error?: string;
}

if (!FormatRegistry.Has("email")) {
    FormatRegistry.Set("email", (value) => /^\S+@\S+\.\S+$/.test(value));
}
if (!FormatRegistry.Has("uuid")) {
    FormatRegistry.Set("uuid", (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
if (!FormatRegistry.Has("ipv4")) {
    FormatRegistry.Set("ipv4", (value) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value));
}
if (!FormatRegistry.Has("ipv6")) {
    FormatRegistry.Set("ipv6", (value) => /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(value));
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
            case "size":
                if (Number.isFinite(n!)) {
                    options.minLength = n!;
                    options.maxLength = n!;
                }
                break;
            case "email":
                options.format = "email";
                break;
            case "url":
                options.format = "uri";
                break;
            case "uuid":
                options.format = "uuid";
                break;
            case "ipv4":
                options.format = "ipv4";
                break;
            case "ipv6":
                options.format = "ipv6";
                break;
            case "alpha":
                patterns.push("^[A-Za-z]+$");
                break;
            case "alpha_num":
                patterns.push("^[A-Za-z0-9]+$");
                break;
            case "alpha_dash":
                patterns.push("^[A-Za-z0-9_-]+$");
                break;
            case "lowercase":
                patterns.push("^[a-z0-9_]*$");
                break;
            case "uppercase":
                patterns.push("^[A-Z0-9_]*$");
                break;
            case "slug":
                patterns.push("^[a-z0-9]+(?:-[a-z0-9]+)*$");
                break;
            case "regex":
                if (raw) patterns.push(raw);
                break;
        }
    }

    if (patterns.length) options.pattern = patterns[0];
    return Type.String(options);
}

function buildNumberDeclaration(parts: string[], defaultValue?: number): TSchema {
    const options: NumberOptions & { default?: number } = {};
    if (defaultValue !== undefined) options.default = defaultValue;

    for (const p of parts) {
        const [key, raw] = p.split(":", 2);
        const n = raw !== undefined ? Number(raw) : undefined;
        if (key === "min" && Number.isFinite(n!)) options.minimum = n!;
        if (key === "max" && Number.isFinite(n!)) options.maximum = n!;
    }

    return Type.Number(options);
}

function buildIntegerDeclaration(parts: string[], defaultValue?: number): TSchema {
    const options: NumberOptions & { default?: number } = {};
    if (defaultValue !== undefined) options.default = defaultValue;

    for (const p of parts) {
        const [key, raw] = p.split(":", 2);
        const n = raw !== undefined ? Number(raw) : undefined;
        if (key === "min" && Number.isFinite(n!)) options.minimum = n!;
        if (key === "max" && Number.isFinite(n!)) options.maximum = n!;
    }

    return Type.Integer(options);
}

function buildFileDeclaration(): TSchema {
    const fileSchema = Type.Object({
        name: Type.String(),
        size: Type.Number(),
        type: Type.String(),
        lastModified: Type.Optional(Type.Number()),
        tempId: Type.Optional(Type.String()),
        content: Type.Optional(Type.String()),
    });
    return Type.Array(fileSchema);
}

export function rule(rules: string, defaultValue?: unknown): TSchema {
    const parts = rules.split("|").map((p) => p.trim()).filter(Boolean);
    const isOptional = parts.includes("optional") || parts.includes("nullable");

    let schema: TSchema;
    if (parts.some((p) => p === "file" || p.startsWith("file:"))) {
        schema = buildFileDeclaration();
    } else if (parts.includes("boolean") || parts.includes("bool")) {
        schema = Type.Boolean({ default: defaultValue as boolean });
    } else if (parts.includes("integer") || parts.includes("int")) {
        schema = buildIntegerDeclaration(parts, defaultValue as number | undefined);
    } else if (parts.includes("number") || parts.includes("numeric")) {
        schema = buildNumberDeclaration(parts, defaultValue as number | undefined);
    } else {
        schema = buildStringDeclaration(parts, defaultValue as string | undefined);
    }

    return isOptional ? Type.Optional(schema) : schema;
}

export class Rule<T extends TSchema = TSchema> {
    constructor(protected schema: T, protected customMessage?: string) {}

    public static string(arg?: string | { min?: number; max?: number; email?: boolean }) {
        if (arg && typeof arg === "object") {
            const options: any = {};
            if (arg.min !== undefined) options.minLength = arg.min;
            if (arg.max !== undefined) options.maxLength = arg.max;
            if (arg.email) options.format = "email";
            return Type.String(options);
        }
        return new Rule(Type.String(), arg as string | undefined);
    }

    public static number(arg?: string | { min?: number; max?: number }) {
        if (arg && typeof arg === "object") {
            const options: any = {};
            if (arg.min !== undefined) options.minimum = arg.min;
            if (arg.max !== undefined) options.maximum = arg.max;
            return Type.Number(options);
        }
        return new Rule(Type.Number(), arg as string | undefined);
    }

    public static integer(message?: string) {
        return new Rule(Type.Integer(), message);
    }

    public static boolean(message?: string) {
        return new Rule(Type.Boolean(), message);
    }

    public static optional(schema: TSchema) {
        return Type.Optional(schema);
    }

    public static in(values: any[], message?: string) {
        return new Rule(Type.Union(values.map((v) => Type.Literal(v))), message);
    }

    public static file(message?: string) {
        return new Rule(buildFileDeclaration() as any, message);
    }

    public min(value: number, message?: string) {
        const s = this.schema as any;
        const msg = message || this.customMessage;
        if (s.type === "string") return new Rule(Type.String({ ...s, minLength: value }), msg);
        if (s.type === "number") return new Rule(Type.Number({ ...s, minimum: value }), msg);
        if (s.type === "integer") return new Rule(Type.Integer({ ...s, minimum: value }), msg);
        if (s.type === "array") return new Rule(Type.Array(s.items, { ...s, minItems: value }), msg);
        return this;
    }

    public max(value: number, message?: string) {
        const s = this.schema as any;
        const msg = message || this.customMessage;
        if (s.type === "string") return new Rule(Type.String({ ...s, maxLength: value }), msg);
        if (s.type === "number") return new Rule(Type.Number({ ...s, maximum: value }), msg);
        if (s.type === "integer") return new Rule(Type.Integer({ ...s, maximum: value }), msg);
        if (s.type === "array") return new Rule(Type.Array(s.items, { ...s, maxItems: value }), msg);
        return this;
    }

    public email(message?: string) {
        return new Rule(Type.String({ ...(this.schema as any), format: "email" }), message || this.customMessage);
    }

    public getSchema() {
        return this.schema;
    }

    public validate(value: any): { success: boolean; errors: string[] } {
        const valToValidate = normalizeFileValue(value);
        const compiled = TypeCompiler.Compile(this.schema);

        if (compiled.Check(valToValidate)) return { success: true, errors: [] };
        if (this.customMessage) return { success: false, errors: [this.customMessage] };

        const first = [...compiled.Errors(valToValidate)][0];
        return { success: false, errors: [first?.message || "Validation failed"] };
    }
}

function normalizeFileValue(value: any) {
    if (value && typeof value === "object" && value.files && Array.isArray(value.files)) {
        return value.files;
    }
    return value;
}

export function validateRule(value: any, rules: string, customMessage?: string): ValidationResult {
    const parts = rules.split("|").map((p) => p.trim());
    const isRequired = parts.includes("required");

    if (isRequired && (value === undefined || value === null || value === "")) {
        return { success: false, error: customMessage || "The field is required." };
    }

    if (!isRequired && (value === undefined || value === null || value === "")) {
        return { success: true };
    }

    const valToValidate = normalizeFileValue(value);

    if (parts.some((p) => p === "file" || p.startsWith("file:"))) {
        const fileParts = Array.isArray(valToValidate) ? valToValidate : (valToValidate ? [valToValidate] : []);

        for (const p of parts) {
            const [key, raw] = p.split(":", 2);
            if (key === "max" && raw && fileParts.length > parseInt(raw)) {
                return { success: false, error: customMessage || `You may not select more than ${raw} file(s).` };
            }
            if (key === "min" && raw && fileParts.length < parseInt(raw)) {
                return { success: false, error: customMessage || `Please select at least ${raw} file(s).` };
            }
        }

        const sizeRule = parts.find((p) => p.startsWith("size:"));
        const mimesRule = parts.find((p) => p.startsWith("mimes:"));
        const maxSize = sizeRule ? parseInt(sizeRule.split(":")[1] || "0") : Infinity;
        const allowedMimes = mimesRule
            ? (mimesRule.split(":")[1] || "").split(",").map((m) => m.trim().toLowerCase()).filter(Boolean)
            : [];

        for (const file of fileParts) {
            if (!file) continue;

            const typeString = String(file.type || "").toLowerCase();
            let fileMime: MIMEType | null = null;
            try {
                fileMime = new MIMEType(typeString);
            } catch {}

            if (allowedMimes.length > 0) {
                const fileName = String(file.name || "").toLowerCase();
                const extension = fileName.includes(".") ? (fileName.split(".").pop() || "") : "";

                const matches = allowedMimes.some((m) => {
                    if (m.includes("/")) {
                        if (m.endsWith("/*")) {
                            const prefix = m.split("/")[0] || "";
                            if (fileMime && fileMime.type === prefix) return true;
                            return typeString.startsWith(`${prefix}/`);
                        }
                        if (fileMime && fileMime.essence === m) return true;
                        return typeString === m;
                    }
                    return extension === m;
                });

                if (!matches) return { success: false, error: customMessage || `The file type is not allowed for ${file.name || "file"}.` };
            }

            if (typeof file.size === "number" && file.size / 1024 > maxSize) {
                return { success: false, error: customMessage || `The file ${file.name || "file"} may not be greater than ${maxSize} kilobytes.` };
            }
        }

        return { success: true };
    }

    const schema = rule(rules);
    const compiled = TypeCompiler.Compile(schema);
    if (compiled.Check(valToValidate)) return { success: true };

    if (customMessage) return { success: false, error: customMessage };

    const first = [...compiled.Errors(valToValidate)][0];
    return { success: false, error: first?.message || "Validation failed" };
}

export const RuleEngine = {
    validate(value: any, ruleDef: TSchema | Rule | string, _state?: Record<string, any>): ValidationResult {
        if (typeof ruleDef === "string") return validateRule(value, ruleDef);
        if (ruleDef instanceof Rule) {
            const result = ruleDef.validate(value);
            return result.success ? { success: true } : { success: false, error: result.errors[0] };
        }

        const compiled = TypeCompiler.Compile(ruleDef);
        const valToValidate = normalizeFileValue(value);
        if (compiled.Check(valToValidate)) return { success: true };

        const first = [...compiled.Errors(valToValidate)][0];
        return { success: false, error: first?.message || "Validation failed" };
    },
};
