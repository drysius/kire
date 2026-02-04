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
    FormatRegistry
} from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { MIMEType } from "node:util";

// Setup standard formats
if (!FormatRegistry.Has('email')) {
    FormatRegistry.Set('email', (value) => /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(value));
}
if (!FormatRegistry.Has('uuid')) {
    FormatRegistry.Set('uuid', (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}
if (!FormatRegistry.Has('ipv4')) {
    FormatRegistry.Set('ipv4', (value) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value));
}
if (!FormatRegistry.Has('ipv6')) {
    FormatRegistry.Set('ipv6', (value) => /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(value));
}

/* -------------------------------------------------------------------------------------------------
 * Type-level definitions for better DX
 * ------------------------------------------------------------------------------------------------- */

export type RuleToken = 
    | "string" | "text" | "number" | "numeric" | "integer" | "int" | "boolean" | "bool" | "file"
    | "required" | "nullable" | "optional" | "sometimes" | "present" | "filled"
    | "email" | "url" | "uuid" | "ipv4" | "ipv6" | "date" | "datetime" | "date_time"
    | "alpha" | "alpha_num" | "alpha_dash" | "ascii" | "lowercase" | "uppercase" | "slug" | "ulid"
    | `min:${number}` | `max:${number}` | `size:${number}` | `between:${number},${number}`
    | `digits:${number}` | `digits_between:${number},${number}`
    | `in:${string}` | `not_in:${string}`
    | `mimes:${string}` | `regex:${string}`
    | "accepted" | "declined" | "declined_if:any" | "accepted_if:any"
    | `same:${string}` | `different:${string}`;

export type RuleString = RuleToken | string;

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
 * MIME Mapping and Helpers
 * ------------------------------------------------------------------------------------------------- */

const EXTENSION_MIME_MAP: Record<string, string[]> = {
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'pdf': ['application/pdf'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'xls': ['application/vnd.ms-excel'],
    'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'ppt': ['application/vnd.ms-powerpoint'],
    'pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    'zip': ['application/zip', 'application/x-zip-compressed'],
    'txt': ['text/plain'],
    'csv': ['text/csv', 'text/comma-separated-values'],
    'mp3': ['audio/mpeg'],
    'mp4': ['video/mp4'],
    'json': ['application/json'],
};

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
            case "email": options.format = "email"; break;
            case "url": options.format = "uri"; break;
            case "uuid": options.format = "uuid"; break;
            case "ipv4": options.format = "ipv4"; break;
            case "ipv6": options.format = "ipv6"; break;
            case "date": options.format = "date"; break;
            case "datetime":
            case "date_time": options.format = "date-time"; break;
            case "alpha": patterns.push("^[A-Za-z]+$"); break;
            case "alpha_num": patterns.push("^[A-Za-z0-9]+$"); break;
            case "alpha_dash": patterns.push("^[A-Za-z0-9_-]+$"); break;
            case "lowercase": patterns.push("^[a-z0-9_]*$"); break;
            case "uppercase": patterns.push("^[A-Z0-9_]*$"); break;
            case "slug": patterns.push("^[a-z0-9]+(?:-[a-z0-9]+)*$"); break;
            case "regex": if (raw) patterns.push(raw); break;
        }
    }

    if (patterns.length) options.pattern = patterns[0];
    return Type.String(options);
}

function buildNumberDeclaration(
    parts: string[],
    defaultValue?: number,
): TNumber {
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

function buildIntegerDeclaration(
    parts: string[],
    defaultValue?: number,
): TInteger {
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

function buildFileDeclaration(parts: string[]): TSchema {
    const fileSchema = Type.Object({
        name: Type.String(),
        size: Type.Number(),
        type: Type.String(),
    });
    return Type.Union([fileSchema, Type.Array(fileSchema)]);
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

    let schema: TSchema;

    if (parts.some(p => p === "file" || p.startsWith("file:"))) {
        schema = buildFileDeclaration(parts);
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

    public static string(message?: string) {
        return new Rule(Type.String(), message);
    }

    public static number(message?: string) {
        return new Rule(Type.Number(), message);
    }

    public static integer(message?: string) {
        return new Rule(Type.Integer(), message);
    }

    public static boolean(message?: string) {
        return new Rule(Type.Boolean(), message);
    }

    public static file(message?: string) {
        return new Rule(
            Type.Object({
                name: Type.String(),
                size: Type.Number(),
                type: Type.String(),
                lastModified: Type.Optional(Type.Number()),
                content: Type.Optional(Type.String())
            }),
            message
        );
    }

    public min(value: number) {
        const s = this.schema as any;
        if (s.type === 'string') return new Rule(Type.String({ ...s, minLength: value }), this.customMessage);
        if (s.type === 'number' || s.type === 'integer') return new Rule(Type.Number({ ...s, minimum: value }), this.customMessage);
        return this;
    }

    public max(value: number) {
        const s = this.schema as any;
        if (s.type === 'string') return new Rule(Type.String({ ...s, maxLength: value }), this.customMessage);
        if (s.type === 'number' || s.type === 'integer') return new Rule(Type.Number({ ...s, maximum: value }), this.customMessage);
        return this;
    }

    public email() {
        return new Rule(Type.String({ ...this.schema as any, format: 'email' }), this.customMessage);
    }

    public getSchema() {
        return this.schema;
    }

    public validate(value: any): { success: boolean; errors: string[] } {
        const C = TypeCompiler.Compile(this.schema);
        if (C.Check(value)) return { success: true, errors: [] };
        
        // Use custom message if provided, otherwise use TypeBox errors
        if (this.customMessage) {
            return { success: false, errors: [this.customMessage] };
        }
        
        const errors = [...C.Errors(value)].map(e => e.message);
        return { success: false, errors };
    }
}

/**
 * Validates a value against a rule string.
 */
export function validateRule(value: any, rules: string, customMessage?: string): { success: boolean; error?: string } {
    const parts = rules.split("|").map(p => p.trim());
    const isRequired = parts.includes("required");
    const isNullable = parts.includes("nullable") || parts.includes("optional");
    
    if (isRequired && (value === undefined || value === null || value === "")) {
        return { success: false, error: customMessage || "The field is required." };
    }

    if (!isRequired && (value === undefined || value === null || value === "")) {
        return { success: true };
    }

    // WireFile specific handling: extract files array if it's a WireFile instance
    let valToValidate = value;
    if (value && typeof value === 'object' && value.files && Array.isArray(value.files)) {
        valToValidate = value.files;
    }

    // Manual File Validation
    if (parts.some(p => p === "file" || p.startsWith("file:"))) {
        const fileParts = Array.isArray(valToValidate) ? valToValidate : [valToValidate];
        
        // Count validation (max files)
        const maxRule = parts.find(p => p.startsWith('max:'));
        if (maxRule) {
            const maxFiles = parseInt(maxRule.split(':')[1]!);
            if (fileParts.length > maxFiles) {
                return { success: false, error: customMessage || `The field may not have more than ${maxFiles} files.` };
            }
        }

        // Mimes and Size validation
        const sizeRule = parts.find(p => p.startsWith('size:'));
        const mimesRule = parts.find(p => p.startsWith('mimes:'));
        const maxSize = sizeRule ? parseInt(sizeRule.split(':')[1]!) : Infinity;
        const allowedMimes = mimesRule ? mimesRule.split(':')[1]!.split(',').map(m => m.trim().toLowerCase()) : [];

        for (const file of fileParts) {
            if (!file) continue;
            
            const typeString = (file.type || "").toLowerCase();
            let fileMime: any = null;
            try {
                fileMime = new MIMEType(typeString);
            } catch (e) {}

            if (allowedMimes.length > 0) {
                const fileName = (file.name || "").toLowerCase();
                const extension = fileName.includes('.') ? fileName.split('.').pop() : "";

                const matches = allowedMimes.some(m => {
                    const lowM = m.toLowerCase();
                    
                    // 1. Exact MIME type match or essence match
                    if (lowM.includes('/')) {
                        if (lowM.endsWith('/*')) {
                            const prefix = lowM.split('/')[0];
                            if (fileMime && fileMime.type === prefix) return true;
                            return typeString.startsWith(`${prefix}/`);
                        }
                        if (fileMime && fileMime.essence === lowM) return true;
                        return typeString === lowM;
                    }
                    
                    // 2. Extension match
                    return extension === lowM;
                });

                if (!matches) return { success: false, error: customMessage || `The file type is not allowed for ${file.name}.` };
            }
            if (file.size / 1024 > maxSize) {
                return { success: false, error: customMessage || `The file ${file.name} may not be greater than ${maxSize} kilobytes.` };
            }
        }
        return { success: true };
    }

    const schema = rule(rules);
    const C = TypeCompiler.Compile(schema);
    const valid = C.Check(valToValidate);
    if (valid) return { success: true };

    if (customMessage) return { success: false, error: customMessage };

    const errors = [...C.Errors(valToValidate)];
    const firstError = errors[0];
    let message = firstError ? firstError.message : "Validation failed";
    
    //@ts-expect-error ignore
    if ("keyword" in firstError) {
        if (firstError.keyword === 'minLength') message = `The field must be at least ${firstError.schema.minLength} characters.`;
        if (firstError.keyword === 'maxLength') message = `The field may not be greater than ${firstError.schema.maxLength} characters.`;
        if (firstError.keyword === 'minimum') message = `The field must be at least ${firstError.schema.minimum}.`;
        if (firstError.keyword === 'maximum') message = `The field may not be greater than ${firstError.schema.maximum}.`;
        if (firstError.keyword === 'format') message = `The field format is invalid (${firstError.schema.format}).`;
        if (firstError.keyword === 'pattern') message = `The field format is invalid.`;
    }

    return { success: false, error: message };
}