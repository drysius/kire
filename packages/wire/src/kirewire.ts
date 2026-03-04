import { createHash } from "node:crypto";
import { EventController } from "./event-controller";
import { SessionManager } from "./session";
import type { Component } from "./component";
import type { WireProperty } from "./wire-property";

export interface KirewireOptions {
    secret: string;
    bus_delay?: number;
    expire_session?: string | number;
    adapter?: any;
}

export class Kirewire extends EventController {
    public components = new Map<string, typeof Component>();
    public propertyClasses = new Map<string, new (...args: any[]) => WireProperty>();
    public sessions: SessionManager;
    private middlewares: Array<(ctx: any) => void> = [];
    public secret: string;

    constructor(public options: KirewireOptions) {
        super();
        this.secret = options.secret;
        const expireMs = typeof options.expire_session === 'string' 
            ? this.parseDuration(options.expire_session) 
            : (options.expire_session || 60000);
        
        this.sessions = new SessionManager(expireMs);
    }

    /**
     * Registers a specialized WireProperty class.
     */
    public class(name: string, PropertyClass: new (...args: any[]) => WireProperty) {
        this.propertyClasses.set(name, PropertyClass);
    }

    public generateChecksum(state: any, sessionId: string): string {
        const data = JSON.stringify(state) + sessionId + this.secret;
        return createHash("sha256").update(data).digest("hex");
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
                for (let i = 0; i < list.length; i++) {
                    const file = list[i];
                    const path = join(dir, file);
                    const stat = statSync(path);
                    if (stat && stat.isDirectory()) results = results.concat(walk(path));
                    else results.push(path);
                }
            } catch(e) {}
            return results;
        };

        const files = walk(searchDir);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
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

