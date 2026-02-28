import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export class FileStore {
    private tempDir: string;
    private fileMap = new Map<string, { path: string, expires: number }>();

    constructor(tempDir: string, private ttl: number = 3600000) { // 1h default
        this.tempDir = tempDir;
        if (!existsSync(this.tempDir)) {
            mkdirSync(this.tempDir, { recursive: true });
        }
        setInterval(() => this.cleanup(), 60000);
    }

    public store(filename: string, buffer: Buffer): string {
        const id = Math.random().toString(36).substring(2, 15);
        const path = join(this.tempDir, `${id}_${filename}`);
        writeFileSync(path, buffer);
        this.fileMap.set(id, { path, expires: Date.now() + this.ttl });
        return id;
    }

    public get(id: string): string | null {
        const entry = this.fileMap.get(id);
        if (entry && existsSync(entry.path)) {
            return entry.path;
        }
        return null;
    }

    public delete(id: string) {
        const entry = this.fileMap.get(id);
        if (entry) {
            if (existsSync(entry.path)) unlinkSync(entry.path);
            this.fileMap.delete(id);
        }
    }

    private cleanup() {
        const now = Date.now();
        for (const [id, entry] of this.fileMap.entries()) {
            if (now > entry.expires) {
                this.delete(id);
            }
        }
    }
}
