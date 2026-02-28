import { createHash } from "node:crypto";
import type { Kire } from "kire";
import { SessionManager } from "./session";
import type { Component } from "./component";

export interface KirewireOptions {
    secret: string;
    busDelay?: number;
    expireSession?: string | number;
    adapter?: any;
}

export class Kirewire {
    public components = new Map<string, typeof Component>();
    public sessions: SessionManager;
    private middlewares: Array<(ctx: any) => void> = [];
    private events = new Map<string, Array<(data: any) => void>>();
    public secret: string;

    constructor(public options: KirewireOptions) {
        this.secret = options.secret;
        const expireMs = typeof options.expireSession === 'string' 
            ? this.parseDuration(options.expireSession) 
            : (options.expireSession || 60000);
        
        this.sessions = new SessionManager(expireMs);
    }

    public generateChecksum(state: any, sessionId: string): string {
        const data = JSON.stringify(state) + sessionId + this.secret;
        return createHash("sha256").update(data).digest("hex");
    }

    public async $emit(event: string, data: any) {
        const handlers = this.events.get(event);
        const ctx = { [event]: data, kirewire: this };
        for (const mw of this.middlewares) { mw(ctx); }
        if (handlers) {
            for (const handler of handlers) { await handler(data); }
        }
    }

    public $on(event: string, callback: (data: any) => void) {
        const names = event.split(',').map(n => n.trim());
        for (const name of names) {
            if (!this.events.has(name)) this.events.set(name, []);
            this.events.get(name)!.push(callback);
        }
    }

    public use(fn: (ctx: any) => void) {
        this.middlewares.push(fn);
    }

    /**
     * Registers components using a glob-like pattern via node:fs.
     */
    public async wireRegister(pattern: string, rootDir: string = process.cwd()) {
        const { existsSync, readdirSync, statSync } = await import("node:fs");
        const { join, resolve, parse } = await import("node:path");
        const { Component } = await import("./component");

        const searchDir = resolve(rootDir, pattern.replace(/\*.*$/, ""));
        if (!existsSync(searchDir)) return;

        const walk = (dir: string): string[] => {
            let results: string[] = [];
            try {
                const list = readdirSync(dir);
                for (const file of list) {
                    const path = join(dir, file);
                    const stat = statSync(path);
                    if (stat && stat.isDirectory()) results = results.concat(walk(path));
                    else results.push(path);
                }
            } catch(e) {}
            return results;
        };

        const files = walk(searchDir);
        for (const file of files) {
            if ((file.endsWith(".js") || file.endsWith(".ts")) && !file.endsWith(".d.ts")) {
                try {
                    const fullPath = resolve(file);
                    const module = await import(fullPath);
                    const componentClass = module.default || Object.values(module).find((e: any) => 
                        typeof e === "function" && e.prototype instanceof Component
                    );

                    if (componentClass) {
                        const relPath = file.slice(searchDir.length + 1);
                        const parsed = parse(relPath);
                        const dirParts = parsed.dir ? parsed.dir.split(/[\\\/]/) : [];
                        const name = [...dirParts, parsed.name].join(".").toLowerCase();
                        
                        this.components.set(name, componentClass);
                        console.log(`[Kirewire] Registered component: ${name}`);
                    }
                } catch (e) {
                    console.error(`[Kirewire] Failed to register ${file}:`, e);
                }
            }
        }
    }

    private parseDuration(duration: string): number {
        const match = duration.match(/^(\d+)([smh])$/);
        if (!match) return 60000;
        const val = parseInt(match[1]!);
        const unit = match[2];
        switch (unit) {
            case 's': return val * 1000;
            case 'm': return val * 60000;
            case 'h': return val * 3600000;
            default: return val;
        }
    }
}
