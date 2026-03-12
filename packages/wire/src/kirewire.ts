import { createHash, randomUUID } from "node:crypto";
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

export type WireReferenceResolver =
    | string
    | ((ctx: { wire: Kirewire; adapter?: any }) => string);

export type WireRouteHandler = (ctx: {
    method: string;
    path: string;
    url: URL;
    query: URLSearchParams;
    params: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
    userId: string;
    sessionId: string;
    wire: Kirewire;
    adapter?: any;
}) => Promise<{ status?: number; headers?: Record<string, string>; result?: any } | any> | { status?: number; headers?: Record<string, string>; result?: any } | any;

type RegisteredRoute = {
    name: string;
    method: string;
    path: string;
    paramNames: string[];
    matcher: RegExp;
    handler: WireRouteHandler;
};

type ComponentListenerContext = {
    userId: string;
    pageId: string;
    id: string;
};

type ComponentListenerPayload = {
    params?: unknown[];
    sourceId?: string;
};

function normalizeRoutePath(path: string): string {
    const value = String(path || "").trim();
    if (!value) return "/";
    const withSlash = value.startsWith("/") ? value : `/${value}`;
    return withSlash.replace(/\/+$/, "") || "/";
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileRoute(path: string): { matcher: RegExp; paramNames: string[] } {
    const normalized = normalizeRoutePath(path);
    const parts = normalized.split("/").filter(Boolean);
    const paramNames: string[] = [];
    const pattern = parts
        .map((part) => {
            if (part === "*") {
                paramNames.push("wildcard");
                return "(.*)";
            }
            if (part.startsWith(":")) {
                const key = part.slice(1).trim();
                paramNames.push(key || "param");
                return "([^/]+)";
            }
            return escapeRegex(part);
        })
        .join("/");

    const source = pattern ? `^/${pattern}/?$` : "^/?$";
    return { matcher: new RegExp(source), paramNames };
}

export class Kirewire extends EventController {
    public components = new Map<string, typeof Component>();
    public propertyClasses = new Map<string, new (...args: any[]) => WireProperty>();
    public sessions: SessionManager;
    private middlewares: Array<(ctx: any) => void> = [];
    private references = new Map<string, WireReferenceResolver>();
    private routes = new Map<string, RegisteredRoute>();
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

    public reference(name: string, value: WireReferenceResolver) {
        const key = String(name || "").trim();
        if (!key) throw new Error("Wire reference name is required.");
        this.references.set(key, value);
    }

    public getReference(name: string, ctx: { adapter?: any } = {}): string | undefined {
        const key = String(name || "").trim();
        if (!key) return undefined;
        const entry = this.references.get(key);
        if (entry === undefined) return undefined;
        if (typeof entry === "function") {
            return String(entry({ wire: this, adapter: ctx.adapter }) || "");
        }
        return String(entry || "");
    }

    public getReferences(ctx: { adapter?: any } = {}): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [name] of this.references.entries()) {
            const value = this.getReference(name, ctx);
            if (value === undefined) continue;
            out[name] = value;
        }
        return out;
    }

    public route(name: string, config: { path: string; method?: string; handler: WireRouteHandler }) {
        const key = String(name || "").trim();
        if (!key) throw new Error("Wire route name is required.");
        if (!config || typeof config.handler !== "function") {
            throw new Error(`Wire route "${key}" requires a handler.`);
        }

        const method = String(config.method || "GET").trim().toUpperCase();
        const path = normalizeRoutePath(config.path);
        const { matcher, paramNames } = compileRoute(path);
        this.routes.set(key, {
            name: key,
            method,
            path,
            paramNames,
            matcher,
            handler: config.handler,
        });
    }

    public removeRoute(name: string): boolean {
        const key = String(name || "").trim();
        if (!key) return false;
        return this.routes.delete(key);
    }

    public matchRoute(method: string, path: string): {
        name: string;
        method: string;
        path: string;
        params: Record<string, string>;
        handler: WireRouteHandler;
    } | null {
        const targetMethod = String(method || "").trim().toUpperCase();
        const targetPath = normalizeRoutePath(path);

        for (const route of this.routes.values()) {
            if (route.method !== targetMethod) continue;
            const match = route.matcher.exec(targetPath);
            if (!match) continue;

            const params: Record<string, string> = {};
            for (let i = 0; i < route.paramNames.length; i++) {
                const key = route.paramNames[i]!;
                params[key] = decodeURIComponent(match[i + 1] || "");
            }

            return {
                name: route.name,
                method: route.method,
                path: route.path,
                params,
                handler: route.handler,
            };
        }

        return null;
    }

    public createComponentId(): string {
        return randomUUID();
    }

    public applySafeLocals(instance: Record<string, any>, locals: Record<string, any> = {}) {
        if (!instance || typeof instance !== "object") return;
        if (!locals || typeof locals !== "object") return;

        const keys = Object.keys(locals);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]!;
            if (this.isBlockedLocalKey(key)) continue;

            const current = instance[key];
            if (typeof current === "function") continue;

            if (
                current &&
                typeof current === "object" &&
                typeof current.hydrate === "function" &&
                typeof current.dehydrate === "function"
            ) {
                current.hydrate(locals[key]);
                continue;
            }

            instance[key] = locals[key];
        }
    }

    public bindComponentListeners(instance: Record<string, any>, context: ComponentListenerContext): () => void {
        if (!instance || typeof instance !== "object") return () => {};

        const listeners = instance.listeners;
        if (!listeners || typeof listeners !== "object") return () => {};

        const cleanups: Array<() => void> = [];
        for (const [event, methodName] of Object.entries(listeners)) {
            const eventName = String(event || "").trim();
            const method = String(methodName || "").trim();
            if (!eventName || !method) continue;

            const off = this.on(`event:${eventName}`, async (data?: ComponentListenerPayload) => {
                if (data?.sourceId === context.id) return;

                const handler = instance[method];
                if (typeof handler !== "function") return;

                const params = Array.isArray(data?.params) ? data.params : [];
                if (typeof instance.$clearEffects === "function") instance.$clearEffects();

                await handler.apply(instance, params);

                const state = typeof instance.getPublicState === "function"
                    ? instance.getPublicState()
                    : {};
                const stateStr = this.serializeStateAttr(state);
                const skipRender = Boolean(instance.__skipRender);
                instance.__skipRender = false;
                let html = "";

                if (!skipRender) {
                    const rendered = typeof instance.render === "function"
                        ? await instance.render()
                        : "";
                    html = rendered?.toString ? rendered.toString() : String(rendered ?? "");
                }

                await this.emit("component:update", {
                    userId: context.userId,
                    pageId: context.pageId,
                    id: context.id,
                    html: skipRender ? "" : `<div wire:id="${context.id}" wire:state='${stateStr}'>${html}</div>`,
                    state,
                    effects: Array.isArray(instance.__effects) ? instance.__effects : [],
                });
            });

            cleanups.push(off);
        }

        return () => {
            for (let i = 0; i < cleanups.length; i++) {
                try {
                    cleanups[i]!();
                } catch {
                    // Ignore listener cleanup errors to keep unmount stable.
                }
            }
        };
    }

    public attachLifecycleGuards(instance: Record<string, any>, cleanup?: () => void) {
        if (!instance || typeof instance !== "object") return;

        const originalUnmount = typeof instance.unmount === "function"
            ? instance.unmount.bind(instance)
            : async () => {};
        let finalized = false;

        instance.unmount = async (...args: unknown[]) => {
            if (finalized) return;
            finalized = true;

            if (typeof cleanup === "function") {
                try {
                    cleanup();
                } catch {
                    // Ignore listener cleanup failures so component can unmount.
                }
            }

            this.disconnectSpecialProperties(instance);
            await originalUnmount(...args);
        };
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
    public async wireRegister(pattern: string, rootDir: string = process.cwd(), namePrefix = "") {
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
                        const localName = [...dirParts, parsed.name].join(".");
                        const prefix = String(namePrefix || "").trim().replace(/\.+$/, "");
                        const name = prefix ? `${prefix}.${localName}` : localName;
                        
                        this.components.set(name, componentClass);
                        console.log(`[Kirewire] Registered component: ${name}`);
                    }
                } catch (e) {
                    console.error(`[Kirewire] Failed to register ${file}:`, e);
                }
            }
        }
    }

    private serializeStateAttr(state: unknown): string {
        try {
            return JSON.stringify(state ?? {}).replace(/'/g, "&#39;");
        } catch {
            return "{}";
        }
    }

    private disconnectSpecialProperties(instance: Record<string, any>) {
        const keys = Object.keys(instance);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]!;
            const value = instance[key];
            if (!value || typeof value !== "object") continue;

            if (value.__wire_type === "broadcast" && typeof value.disconnect === "function") {
                try {
                    value.disconnect(instance);
                } catch {
                    // Ignore disconnection errors to avoid breaking unmount.
                }
            }
        }
    }

    private isBlockedLocalKey(key: string): boolean {
        if (!key) return true;
        if (key === "__proto__" || key === "prototype" || key === "constructor") return true;

        const first = key.charCodeAt(0);
        return first === 36 || first === 95; // $ or _
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

    public async destroy() {
        await this.sessions.destroy();
        this.clear();
        this.components.clear();
        this.propertyClasses.clear();
        this.references.clear();
        this.routes.clear();
    }
}

