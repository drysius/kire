import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { WireCacheDriver } from "../types";
import type { Kire } from "kire";

export class WireMemoryCaching implements WireCacheDriver {
    private localStore = new Map<string, any>();

    constructor(private kire?: Kire) {}

    private get store(): Map<string, any> {
        return this.kire ? this.kire.cached('@kirejs/wire') : this.localStore;
    }

    async get(key: string) {
        const item = this.store.get(`file:${key}`);
        if (!item) return null;
        return { stream: item.buffer, mime: item.mime };
    }

    async set(key: string, value: any, mime: string) {
        let buffer: Buffer;
        if (Buffer.isBuffer(value)) {
            buffer = value;
        } else if (typeof value === 'string') {
            buffer = Buffer.from(value);
        } else if (value && (typeof value.pipe === 'function' || value[Symbol.asyncIterator])) {
            const chunks = [];
            for await (const chunk of value) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
        } else {
            throw new Error("Invalid value for MemoryCache");
        }
        this.store.set(`file:${key}`, { buffer, mime });
    }

    async del(key: string) {
        this.store.delete(`file:${key}`);
    }

    async put(key: string, value: any, ttl?: number) {
        this.store.set(`meta:${key}`, { 
            value, 
            expires: ttl ? Date.now() + ttl : Infinity 
        });
    }

    async retrieve<T>(key: string): Promise<T | null> {
        const item = this.store.get(`meta:${key}`);
        if (!item) return null;
        if (item.expires < Date.now()) {
            this.store.delete(`meta:${key}`);
            return null;
        }
        return item.value as T;
    }

    async forget(key: string) {
        this.store.delete(`meta:${key}`);
    }
}

export class WireFileCaching implements WireCacheDriver {
    constructor(private dir: string, private kire?: Kire) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    async get(key: string) {
        const path = join(this.dir, key);
        const metaPath = join(this.dir, key + '.meta');
        
        if (!existsSync(path) || !existsSync(metaPath)) return null;
        
        const fs = await import("node:fs");
        const mime = fs.readFileSync(metaPath, 'utf-8');
        return { stream: createReadStream(path), mime };
    }

    async set(key: string, value: any, mime: string) {
        const path = join(this.dir, key);
        const metaPath = join(this.dir, key + '.meta');

        const fs = await import("node:fs");
        fs.writeFileSync(metaPath, mime);

        if (Buffer.isBuffer(value) || typeof value === 'string') {
            const fsp = await import("node:fs/promises");
            await fsp.writeFile(path, value);
        } else if (value) {
            const dest = createWriteStream(path);
            if (value instanceof Readable || typeof value.pipe === 'function') {
                value.pipe(dest);
            } else if (value[Symbol.asyncIterator]) {
                for await (const chunk of value) {
                    dest.write(chunk);
                }
                dest.end();
            }
            await new Promise((resolve, reject) => {
                dest.on('finish', resolve);
                dest.on('error', reject);
            });
        }
    }

    async del(key: string) {
        const path = join(this.dir, key);
        const metaPath = join(this.dir, key + '.meta');
        if (existsSync(path)) unlinkSync(path);
        if (existsSync(metaPath)) unlinkSync(metaPath);
    }

    async put(key: string, value: any, ttl?: number) {
        const path = join(this.dir, key + '.json');
        const data = {
            value,
            expires: ttl ? Date.now() + ttl : null
        };
        const fsp = await import("node:fs/promises");
        await fsp.writeFile(path, JSON.stringify(data));
    }

    async retrieve<T>(key: string): Promise<T | null> {
        const path = join(this.dir, key + '.json');
        if (!existsSync(path)) return null;
        
        try {
            const fsp = await import("node:fs/promises");
            const content = await fsp.readFile(path, 'utf-8');
            const data = JSON.parse(content);
            if (data.expires && data.expires < Date.now()) {
                unlinkSync(path);
                return null;
            }
            return data.value as T;
        } catch {
            return null;
        }
    }

    async forget(key: string) {
        const path = join(this.dir, key + '.json');
        if (existsSync(path)) unlinkSync(path);
    }
}
