import type { Component } from "./component";
import { FileManager } from "./file";

export interface FileUploadOptions {
    maxSize?: number; // KB
    types?: string[]; // mime list/patterns
    quantity?: number; // max files
}

type UploadingState = {
    progress: number;
    percent: number;
    loaded: number;
    total: number;
};

const COMPLETED_UPLOAD: UploadingState = {
    progress: 100,
    percent: 100,
    loaded: 0,
    total: 0,
};

export class FileUpload {
    public files: any[] = [];
    public uploading: UploadingState = { ...COMPLETED_UPLOAD };

    constructor(public options: FileUploadOptions = {}) {}

    get file() {
        return this.files[0];
    }

    public async populate(files: any[], component?: Component, property?: string) {
        if (!component) return;

        const kire = (component as any).kire;
        const wireState = kire?.$kire?.["~wire"];
        if (!wireState) return;
        if (!wireState.files) {
            wireState.files = new FileManager(wireState.options?.directoryTmp);
        }
        const manager = wireState.files;

        let inputFiles = Array.isArray(files) ? files : [files];
        inputFiles = inputFiles.filter(Boolean);

        if (this.options.quantity && inputFiles.length > this.options.quantity) {
            if (property) component.addError(property, `You may not upload more than ${this.options.quantity} file(s).`);
            inputFiles = inputFiles.slice(0, this.options.quantity);
        }

        const validFiles: any[] = [];
        for (const f of inputFiles) {
            let isValid = true;
            const mime = String(f?.type || f?.mimetype || "").toLowerCase();

            if (this.options.types?.length) {
                const allowed = this.options.types.some((t) => mime.includes(String(t).toLowerCase()));
                if (!allowed) {
                    isValid = false;
                    if (property) component.addError(property, `File type ${mime || "unknown"} is not allowed.`);
                }
            }

            if (this.options.maxSize && typeof f?.size === "number" && f.size / 1024 > this.options.maxSize) {
                isValid = false;
                if (property) component.addError(property, `File is too large (max ${this.options.maxSize}KB).`);
            }

            if (isValid) validFiles.push(f);
        }

        this.uploading = { ...COMPLETED_UPLOAD };

        this.files = await Promise.all(validFiles.map(async (f) => {
            let buffer: Buffer | null = null;
            let mime = f.type || f.mimetype || "application/octet-stream";
            let name = f.filename || f.name || "upload.bin";

            if (typeof f.content === "string" && f.content.startsWith("data:")) {
                const matches = f.content.match(/^data:([A-Za-z0-9\-+/.]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    mime = matches[1];
                    buffer = Buffer.from(matches[2], "base64");
                }
            } else if (f.data && Buffer.isBuffer(f.data)) {
                buffer = f.data;
            } else if (typeof f.toBuffer === "function") {
                buffer = await f.toBuffer();
            }

            if (buffer) {
                const temp = await manager.store(buffer, name, mime);
                return {
                    name,
                    size: buffer.length,
                    type: mime,
                    lastModified: f.lastModified,
                    tempId: temp.id,
                    uploading: { ...COMPLETED_UPLOAD },
                };
            }

            return { ...f, uploading: { ...COMPLETED_UPLOAD } };
        }));
    }

    public temporaryUrl(config?: { route?: string }) {
        const route = config?.route || "/_wire";
        if (this.file?.tempId) return `${route}/preview?id=${this.file.tempId}`;
        return "";
    }

    public map(callback: (file: any, index: number) => any) {
        return this.files.map(callback);
    }

    public toJSON() {
        return {
            _wire_type: "WireFile",
            options: this.options,
            files: this.files.map(({ buffer, content, data, ...rest }) => rest),
            uploading: this.uploading,
        };
    }
}

export const WireFile = FileUpload;
