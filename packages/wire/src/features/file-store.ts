import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";

export class FileStore {
    private tempDir: string;
    private fileMap = new Map<string, { path: string, expires: number }>();
    private cleanupTimer: ReturnType<typeof setInterval>;

    constructor(tempDir: string, private ttl: number = 3600000) { // 1h default
        this.tempDir = tempDir;
        if (!existsSync(this.tempDir)) {
            mkdirSync(this.tempDir, { recursive: true });
        }
        this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
        if (typeof (this.cleanupTimer as any)?.unref === "function") {
            (this.cleanupTimer as any).unref();
        }
    }

    public store(filename: string, buffer: Buffer): string {
        const id = randomUUID();
        const safeName = basename(String(filename || "upload.bin")).replace(/[^\w.\-]/g, "_");
        const path = join(this.tempDir, `${id}_${safeName}`);
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

    public destroy() {
        clearInterval(this.cleanupTimer);
        const ids = Array.from(this.fileMap.keys());
        for (let i = 0; i < ids.length; i++) {
            this.delete(ids[i]!);
        }
    }
}
