import { randomUUID } from "node:crypto";
import type { WireComponent } from "../component";

export interface WireFileOptions {
    maxSize?: number; // in KB
    types?: string[]; // e.g. ['image/png', 'application/pdf']
    quantity?: number; // Max files
}

export class WireFile {
    public files: any[] = [];
    public uploading = { progress: 100, percent: 100, loaded: 0, total: 0 };
    
    constructor(public options: WireFileOptions = {}) {}

    get file() {
        return this.files[0];
    }

    public async populate(files: any[], component?: WireComponent, property?: string) {
        if (!component) return;
        const kire = component.kire;

        let inputFiles = Array.isArray(files) ? files : [files];
        inputFiles = inputFiles.filter(f => f);

        const validFiles: any[] = [];

        for (const f of inputFiles) {
            let isValid = true;
            if (this.options.types) {
                const mime = f.type || f.mimetype;
                if (!this.options.types.some(t => mime.includes(t))) {
                    isValid = false;
                    if (property) component.addError(property, `File type ${mime} is not allowed.`);
                }
            }
            if (this.options.maxSize) {
                if (f.size / 1024 > this.options.maxSize) {
                    isValid = false;
                    if (property) component.addError(property, `File is too large (max ${this.options.maxSize}KB).`);
                }
            }
            if (isValid) validFiles.push(f);
        }
        
        const completedState = { progress: 100, loaded: 0, total: 0, percent: 100 };
        this.uploading = completedState;

        this.files = await Promise.all(validFiles.map(async f => {
            let buffer: Buffer | null = null;
            let mime = f.type || f.mimetype;
            let name = f.filename || f.name;

            if (f.content && f.content.startsWith('data:')) {
                const matches = f.content.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    mime = matches[1];
                    buffer = Buffer.from(matches[2], 'base64');
                }
            } else if (f.data && Buffer.isBuffer(f.data)) {
                buffer = f.data;
            } else if (typeof f.toBuffer === 'function') {
                buffer = await f.toBuffer();
            }

            if (buffer) {
                const id = await kire.wireStoreTempFile(buffer, mime, name);
                return { name, size: buffer.length, type: mime, lastModified: f.lastModified, tempId: id, uploading: completedState };
            }

            return { ...f, uploading: completedState };
        }));
    }

    public temporaryUrl(config?: any) {
        const route = config?.route || "/_wire";
        if (this.file && this.file.tempId) {
            return `${route}/preview?id=${this.file.tempId}`;
        }
        return "";
    }

    public map(callback: (file: any, index: number) => any) {
        return this.files.map(callback);
    }
    
    toJSON() {
        return {
            _wire_type: 'WireFile',
            options: this.options,
            files: this.files.map(({ buffer, content, data, ...rest }) => rest),
            uploading: this.uploading
        };
    }
}
