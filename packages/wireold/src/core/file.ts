import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export interface TempFile {
    id: string;
    path: string;
    name: string;
    mime: string;
    size: number;
    created: number;
}

export class FileManager {
    private dir: string;

    constructor(dir?: string) {
        this.dir = dir || resolve(process.cwd(), "node_modules/.wire-tmp");
        if (!existsSync(this.dir)) {
            mkdirSync(this.dir, { recursive: true });
        }
        this.cleanup();
    }

    public async store(buffer: Buffer | string, name: string, mime: string): Promise<TempFile> {
        const id = randomUUID();
        const path = join(this.dir, id);
        
        writeFileSync(path, buffer);
        
        // Store metadata
        const meta = { id, name, mime, size: buffer.length, created: Date.now() };
        writeFileSync(path + ".meta", JSON.stringify(meta));

        return { ...meta, path };
    }

    public get(id: string): { file: Buffer, meta: TempFile } | null {
        const path = join(this.dir, id);
        if (!existsSync(path) || !existsSync(path + ".meta")) return null;

        const meta = JSON.parse(readFileSync(path + ".meta", "utf-8"));
        const file = readFileSync(path);
        
        return { file, meta };
    }

    private cleanup() {
        // Simple cleanup: remove files older than 1 hour
        try {
            const now = Date.now();
            const files = (require("fs").readdirSync)(this.dir);
            for (const f of files) {
                if (f.endsWith(".meta")) {
                    const path = join(this.dir, f);
                    const meta = JSON.parse(readFileSync(path, "utf-8"));
                    if (now - meta.created > 3600000) { // 1 hour
                        rmSync(join(this.dir, meta.id));
                        rmSync(path);
                    }
                }
            }
        } catch (e) {}
    }
}
