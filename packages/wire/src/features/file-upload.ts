import type { FileStore } from "./file-store";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

type FileLike = {
    id?: string;
    name: string;
    size: number;
    mime?: string;
    type?: string;
};

const FILE_ENTRY_SCHEMA = Type.Object(
    {
        name: Type.String(),
        size: Type.Number({ minimum: 0 }),
        mime: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        id: Type.Optional(Type.String()),
    },
    { additionalProperties: true },
);

function normalizeFileList(value: any): FileLike[] {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .filter(Boolean)
            .map((file) => ({
                id: String((file as any).id || ""),
                name: String((file as any).name || ""),
                size: Number((file as any).size || 0),
                mime: String((file as any).mime || (file as any).type || ""),
                type: String((file as any).type || (file as any).mime || ""),
            }))
            .filter((file) => file.name || file.id);
    }

    if (value && typeof value === "object" && Array.isArray((value as any).files)) {
        return normalizeFileList((value as any).files);
    }

    if (value && typeof value === "object") {
        const file = value as any;
        const id = String(file.id || "");
        const name = String(file.name || "");
        const size = Number(file.size || 0);
        const mime = String(file.mime || file.type || "");
        const type = String(file.type || file.mime || "");

        if (!id && !name) return [];
        return [{ id, name, size, mime, type }];
    }

    return [];
}

function matchesMimeRule(file: FileLike, allowed: string[]): boolean {
    const mime = String(file.mime || file.type || "").toLowerCase();
    const extension = String(file.name || "")
        .toLowerCase()
        .split(".")
        .pop() || "";

    return allowed.some((token) => {
        const normalized = token.toLowerCase().trim();
        if (!normalized) return false;

        if (normalized.includes("/")) {
            if (normalized.endsWith("/*")) {
                const prefix = normalized.split("/")[0];
                return mime.startsWith(`${prefix}/`);
            }
            return mime === normalized;
        }

        return extension === normalized;
    });
}

export class WireFile {
    public id: string = '';
    public name: string = '';
    public size: number = 0;
    public mime: string = '';
    public __is_wire_file = true;

    constructor(data?: { id: string, name: string, size: number, mime: string }) {
        if (data) {
            this.id = data.id;
            this.name = data.name;
            this.size = data.size;
            this.mime = data.mime;
        }
    }

    public get file() {
        return this.id ? this : null;
    }

    /**
     * Get the real file path from the store.
     */
    public getPath(store: FileStore): string | null {
        return store.get(this.id);
    }
}

export class Rule {
    private requiredMessage?: string;
    private minItems?: number;
    private maxItems?: number;
    private minMessage?: string;
    private maxMessage?: string;
    private maxSizeKb?: number;
    private maxSizeMessage?: string;
    private allowedMimes: string[] = [];
    private mimesMessage?: string;

    constructor(requiredMessage?: string) {
        this.requiredMessage = requiredMessage;
    }

    static file(msg?: string) {
        return new Rule(msg);
    }

    min(val: number, msg?: string) {
        this.minItems = Math.max(0, Number(val || 0));
        if (msg) this.minMessage = msg;
        return this;
    }

    max(val: number, msg?: string) {
        this.maxItems = Math.max(0, Number(val || 0));
        if (msg) this.maxMessage = msg;
        return this;
    }

    size(kilobytes: number, msg?: string) {
        this.maxSizeKb = Math.max(0, Number(kilobytes || 0));
        if (msg) this.maxSizeMessage = msg;
        return this;
    }

    mimes(values: string | string[], msg?: string) {
        const list = Array.isArray(values) ? values : String(values || "").split(",");
        this.allowedMimes = list.map((entry) => entry.trim()).filter(Boolean);
        if (msg) this.mimesMessage = msg;
        return this;
    }

    validate(value: any): { success: boolean; errors: string[] } {
        const files = normalizeFileList(value);

        if (this.requiredMessage && files.length === 0) {
            return { success: false, errors: [this.requiredMessage] };
        }

        const arraySchema = Type.Array(FILE_ENTRY_SCHEMA, {
            minItems: this.minItems,
            maxItems: this.maxItems,
        });

        if (!Value.Check(arraySchema, files)) {
            if (this.minItems !== undefined && files.length < this.minItems) {
                return {
                    success: false,
                    errors: [this.minMessage || `Please select at least ${this.minItems} file(s).`],
                };
            }
            if (this.maxItems !== undefined && files.length > this.maxItems) {
                return {
                    success: false,
                    errors: [this.maxMessage || `You may not select more than ${this.maxItems} file(s).`],
                };
            }

            const first = [...Value.Errors(arraySchema, files)][0];
            return { success: false, errors: [first?.message || "Invalid file selection."] };
        }

        if (this.maxSizeKb !== undefined) {
            for (const file of files) {
                if (file.size / 1024 > this.maxSizeKb) {
                    return {
                        success: false,
                        errors: [
                            this.maxSizeMessage ||
                                `The file ${file.name || "file"} may not be greater than ${this.maxSizeKb} KB.`,
                        ],
                    };
                }
            }
        }

        if (this.allowedMimes.length > 0) {
            for (const file of files) {
                if (!matchesMimeRule(file, this.allowedMimes)) {
                    return {
                        success: false,
                        errors: [this.mimesMessage || `The file type is not allowed for ${file.name || "file"}.`],
                    };
                }
            }
        }

        return { success: true, errors: [] };
    }
}

export const fileUploadMiddleware = (store: FileStore) => (ctx: any) => {
    // Middleware logic to detect WireFile instances in component state
    if (ctx['component:create'] || ctx['component:update']) {
        const data = ctx['component:create'] || ctx['component:update'];
        const component = data.component || data.instance;
        
        if (component) {
            for (const key of Object.keys(component)) {
                if (component[key] && component[key].__is_wire_file) {
                    component[key] = new WireFile(component[key]);
                }
            }
        }
    }
};
