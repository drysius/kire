import { randomUUID } from "node:crypto";
import { Wired } from "../wired";
import type { WireComponent } from "../component";

export interface WireFileOptions {
    maxSize?: number; // in KB
    types?: string[]; // e.g. ['image/png', 'application/pdf']
    quantity?: number; // Max files
}

export class WireFile {
    public files: any[] = [];
    
    constructor(public options: WireFileOptions = {}) {}

    get file() {
        return this.files[0];
    }

    public async populate(files: any[], component?: WireComponent, property?: string) {
        let inputFiles = Array.isArray(files) ? files : [files];
        inputFiles = inputFiles.filter(f => f); // Filter nulls

        const validFiles: any[] = [];

        for (const f of inputFiles) {
            let isValid = true;

            // Type Validation
            if (this.options.types) {
                const mime = f.type || f.mimetype; // Handle both structures
                const match = this.options.types.some(t => mime.includes(t));
                if (!match) {
                    isValid = false;
                    if (component && property) {
                        component.addError(property, `File type ${mime} is not allowed.`);
                    }
                }
            }

            // Size Validation
            if (this.options.maxSize) {
                const sizeKB = f.size / 1024;
                if (sizeKB > this.options.maxSize) {
                    isValid = false;
                    if (component && property) {
                        component.addError(property, `File is too large (max ${this.options.maxSize}KB).`);
                    }
                }
            }

            if (isValid) {
                validFiles.push(f);
            }
        }
        
        // Store in temp storage
        this.files = await Promise.all(validFiles.map(async f => {
            // Completed state structure
            const completedState = {
                progress: 100,
                loaded: f.size,
                total: f.size,
                percent: 100
            };

            if (f.content && f.content.startsWith('data:')) {
                const matches = f.content.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const mime = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    const id = await Wired.storeTempFile(buffer, mime, f.name);
                    
                    return {
                        name: f.name,
                        size: f.size,
                        type: mime,
                        lastModified: f.lastModified,
                        tempId: id,
                        buffer: buffer,
                        uploading: completedState
                    };
                }
            }
            // Handle Fastify Multipart buffer if passed directly without content string
            if ((f.data && Buffer.isBuffer(f.data)) || (typeof f.toBuffer === 'function')) {
                 const mime = f.mimetype || f.type;
                 let buffer: Buffer;
                 if (typeof f.toBuffer === 'function') {
                     buffer = await f.toBuffer();
                 } else {
                     buffer = f.data;
                 }
                 
                 const id = await Wired.storeTempFile(buffer, mime, f.filename || f.name);
                 return {
                        name: f.filename || f.name,
                        size: buffer.length,
                        type: mime,
                        tempId: id,
                        buffer: buffer,
                        uploading: completedState
                 };
            }

            return {
                ...f,
                uploading: completedState
            };
        }));
    }

    public temporaryUrl() {
        if (this.file && this.file.tempId) {
            return `/_wired/preview?id=${this.file.tempId}`;
        }
        return "";
    }

    public map(callback: (file: any, index: number) => any) {
        return this.files.map(callback);
    }
    
    toJSON() {
        const safeFiles = this.files.map(f => {
            const { buffer, content, data, ...rest } = f;
            return rest;
        });

        return {
            _wire_type: 'WireFile',
            options: this.options,
            files: safeFiles
        };
    }
}