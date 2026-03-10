import morph from "@alpinejs/morph";
import { EventController, type Listener } from "../src/event-controller";
import { bus } from "./utils/message-bus";

export interface WireClientContext {
    el: HTMLElement;
    value: string;
    expression: string;
    modifiers: string[];
    cleanup: (fn: () => void) => void;
    wire: KirewireClient;
    adapter: WireAdapter;
    componentId: string;
}

export type WireClientDirective = (ctx: WireClientContext) => void;

export interface WireAdapter {
    call(componentId: string, method: string, params: any[]): Promise<any>;
    defer(componentId: string, property: string, value: any): void;
    upload(files: FileList | File[], onProgress?: (progress: any) => void): Promise<any>;
    reconfigure?(config: Partial<WireClientConfig>): void;
    abortAllRequests?(): void;
    setup?(): void;
    destroy?(): void;
}

export interface WireClientConfig {
    pageId?: string;
    url?: string;
    uploadUrl?: string;
    busDelay?: number;
    transport?: string;
}

declare global {
    interface KirewireNavigateRuntime {
        navigateTo: (url: string, options?: { replace?: boolean; force?: boolean; reason?: string }) => Promise<void>;
        refreshCurrentPage: (options?: { replace?: boolean; force?: boolean; reason?: string }) => Promise<void>;
    }

    interface Window {
        __WIRE_INITIAL_CONFIG__?: WireClientConfig;
        Kirewire?: KirewireClient;
        KirewireNavigate?: KirewireNavigateRuntime;
    }
}

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, "");
}

function resolveDefaultUploadUrl(url: string): string {
    return `${trimTrailingSlash(url)}/upload`;
}

export class KirewireClient extends EventController {
    private directives: Array<{ pattern: RegExp | string; handler: WireClientDirective }> = [];
    public components = new Map<string, any>();
    public pageId = "default";
    public adapter!: WireAdapter;
    public readonly bus = bus;

    private started = false;
    private observer: MutationObserver | null = null;
    private deferredUpdates = new Map<string, Record<string, any>>();
    private cleanupByElement = new WeakMap<HTMLElement, Array<() => void>>();
    private navigationInFlight = false;
    private config: Required<Pick<WireClientConfig, "url" | "uploadUrl" | "transport">> = {
        url: "/_wire",
        uploadUrl: "/_wire/upload",
        transport: "sse",
    };

    public directive(pattern: RegExp | string, handler: WireClientDirective) {
        this.directives.push({ pattern, handler });
    }

    public getDirective(name: string): WireClientDirective | undefined {
        for (let i = this.directives.length - 1; i >= 0; i--) {
            const item = this.directives[i]!;
            if (typeof item.pattern === "string" && item.pattern === name) {
                return item.handler;
            }
        }
        return undefined;
    }

    public configure(config: WireClientConfig = {}) {
        if (config.pageId) {
            this.pageId = String(config.pageId);
        }

        if (config.busDelay !== undefined) {
            const delay = Number(config.busDelay);
            if (Number.isFinite(delay) && delay >= 0) {
                this.bus.setDelay(delay);
            }
        }

        const nextUrl = config.url ? String(config.url) : this.config.url;
        const nextUpload = config.uploadUrl
            ? String(config.uploadUrl)
            : (config.url ? resolveDefaultUploadUrl(String(config.url)) : this.config.uploadUrl);
        const nextTransport = config.transport ? String(config.transport) : this.config.transport;

        this.config = {
            url: nextUrl,
            uploadUrl: nextUpload,
            transport: nextTransport,
        };

        if (this.adapter && typeof this.adapter.reconfigure === "function") {
            this.adapter.reconfigure({
                pageId: this.pageId,
                url: this.config.url,
                uploadUrl: this.config.uploadUrl,
                transport: this.config.transport,
            });
        }
    }

    public getUploadUrl() {
        return this.config.uploadUrl;
    }

    public setAdapter(adapter: WireAdapter) {
        if (this.adapter && this.adapter !== adapter && typeof this.adapter.destroy === "function") {
            this.adapter.destroy();
        }
        this.adapter = adapter;
    }

    public start(Alpine: any) {
        const globalConfig = typeof window !== "undefined" ? window.__WIRE_INITIAL_CONFIG__ : undefined;
        if (globalConfig) this.configure(globalConfig);

        if (this.started) return;

        if (!Alpine) {
            console.error("[Kirewire] Alpine instance is required to start.");
            return;
        }

        this.ensureAdapter();
        this.setupRemovalObserver();

        (window as any).Alpine = Alpine;
        Alpine.plugin(morph);

        Alpine.magic("wire", (el: HTMLElement) => this.getComponentProxy(el));
        Alpine.addRootSelector(() => "[wire\\:id], [wire-id]");

        Alpine.interceptInit(Alpine.skipDuringClone((el: HTMLElement) => {
            const componentId = this.getComponentId(el);
            if (!componentId) return;

            if (!this.components.has(componentId)) {
                this.components.set(componentId, this.createProxy(componentId, el));
            }

            this.attachWireToDataScopes(el, componentId);
            this.processWireAttributes(el, componentId);
        }));

        this.on("component:update", (data) => {
            const proxy = this.components.get(data?.id);
            if (proxy && (proxy as any).__target) {
                const target = (proxy as any).__target;
                const keys = Object.keys(target);
                for (let i = 0; i < keys.length; i++) delete target[keys[i]!];
            }
        });

        if (!Alpine.started) {
            Alpine.start();
        }

        this.started = true;
        this.emitSync("wire:ready", {});
    }

    private ensureAdapter(): boolean {
        if (this.adapter) return true;

        const AdapterCtor = (this as any).HttpClientAdapter;
        if (typeof AdapterCtor === "function") {
            this.adapter = new AdapterCtor({
                url: this.config.url,
                uploadUrl: this.config.uploadUrl,
                pageId: this.pageId,
                transport: this.config.transport,
            });
        }

        if (!this.adapter) {
            console.error("[Kirewire] No adapter configured. Provide one before calling wire actions.");
            return false;
        }

        return true;
    }

    private processWireAttributes(el: HTMLElement, componentId: string) {
        if ((el as any)._kirewire_init) return;
        (el as any)._kirewire_init = true;

        const cleanups: Array<() => void> = [];
        this.cleanupByElement.set(el, cleanups);
        const registerCleanup = (fn: () => void) => {
            cleanups.push(fn);
        };

        const attrs = el.getAttributeNames();
        for (let i = 0; i < attrs.length; i++) {
            const attrName = attrs[i]!;
            if (attrName.charCodeAt(0) !== 119 || !attrName.startsWith("wire:")) continue;

            const fullValue = attrName.slice(5);
            const parts = fullValue.split(".");
            const value = parts[0]!;
            const modifiers = parts.slice(1);
            const expression = el.getAttribute(attrName) || "";

            for (let j = 0; j < this.directives.length; j++) {
                const dir = this.directives[j]!;
                let matched = false;
                if (typeof dir.pattern === "string") {
                    if (dir.pattern === value) matched = true;
                } else if (dir.pattern.test(fullValue)) {
                    matched = true;
                }

                if (matched) {
                    dir.handler({
                        el,
                        value,
                        expression,
                        modifiers,
                        cleanup: registerCleanup,
                        wire: this,
                        adapter: this.adapter,
                        componentId,
                    });
                }
            }
        }
    }

    private attachWireToDataScopes(el: HTMLElement, componentId: string) {
        const bind = () => {
            const scopes = (el as any)._x_dataStack;
            if (!Array.isArray(scopes)) return;
            const proxy = this.components.get(componentId);

            for (let i = 0; i < scopes.length; i++) {
                const scope = scopes[i];
                if (!scope || typeof scope !== "object") continue;
                if (Object.prototype.hasOwnProperty.call(scope, "$wire")) continue;

                Object.defineProperty(scope, "$wire", {
                    get: () => proxy,
                    enumerable: false,
                    configurable: true,
                });
            }
        };

        if ((el as any)._x_dataStack) bind();
        else queueMicrotask(bind);
    }

    public defer(componentId: string, property: string, value: any) {
        const id = String(componentId || "").trim();
        const prop = String(property || "").trim();
        if (!id || !prop) return;

        let updates = this.deferredUpdates.get(id);
        if (!updates) {
            updates = Object.create(null);
            this.deferredUpdates.set(id, updates);
        }
        updates[prop] = value;

        this.emitSync("component:dirty", { id, isDirty: true, property: prop });
    }

    private consumeDeferred(componentId: string): Array<{ method: string; params: any[] }> {
        const updates = this.deferredUpdates.get(componentId);
        if (!updates) return [];

        this.deferredUpdates.delete(componentId);
        const keys = Object.keys(updates);
        if (keys.length === 0) return [];

        this.emitSync("component:dirty", { id: componentId, isDirty: false });

        const actions: Array<{ method: string; params: any[] }> = [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]!;
            actions.push({ method: "$set", params: [key, updates[key]] });
        }
        return actions;
    }

    public async call(el: HTMLElement, method: string, params: any[] = []) {
        if (this.navigationInFlight) return;

        const componentId = this.getComponentId(el);
        if (!componentId) return;
        if (!this.ensureAdapter()) return;

        const normalized = this.normalizeAction(method, params);
        const actions = [...this.consumeDeferred(componentId), normalized];

        this.emitSync("component:call", {
            id: componentId,
            method: normalized.method,
            params: normalized.params,
        });

        try {
            const responses = await Promise.all(
                actions.map((action) => this.adapter.call(componentId, action.method, action.params)),
            );
            const result = responses[responses.length - 1];
            this.emitSync("component:finished", { id: componentId });
            return responses.length > 1 ? responses : result;
        } catch (error) {
            const message = String((error as any)?.message || "");
            const name = String((error as any)?.name || "");
            if (
                this.navigationInFlight &&
                (
                    name === "AbortError" ||
                    message.includes("Cancelled due to navigation") ||
                    message.includes("MessageBus batch cancelled")
                )
            ) {
                this.emitSync("component:finished", { id: componentId });
                return;
            }
            this.emitSync("component:error", { id: componentId, error });
            throw error;
        }
    }

    private normalizeAction(method: string, params: any[]) {
        const cleanMethod = String(method || "").trim();
        if (params.length > 0) {
            return { method: cleanMethod, params };
        }

        const parsed = this.parseActionExpression(cleanMethod);
        if (parsed) return parsed;
        return { method: cleanMethod, params };
    }

    private parseActionExpression(expression: string): { method: string; params: any[] } | null {
        const match = expression.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([\s\S]*)\)$/);
        if (!match) return null;

        const method = match[1]!;
        const rawArgs = match[2]!.trim();
        if (!rawArgs) return { method, params: [] };

        const params = this.parseArgs(rawArgs);
        return { method, params };
    }

    private parseArgs(argsSource: string): any[] {
        const tokens: string[] = [];
        let current = "";
        let dPar = 0;
        let dBra = 0;
        let dCur = 0;
        let inQ: string | null = null;

        for (let i = 0; i < argsSource.length; i++) {
            const c = argsSource[i]!;
            if (inQ) {
                if (c === inQ && argsSource[i - 1] !== "\\") inQ = null;
            } else {
                if (c === "\"" || c === "'") inQ = c;
                else if (c === "(") dPar++;
                else if (c === ")") dPar--;
                else if (c === "[") dBra++;
                else if (c === "]") dBra--;
                else if (c === "{") dCur++;
                else if (c === "}") dCur--;
                else if (c === "," && dPar === 0 && dBra === 0 && dCur === 0) {
                    tokens.push(current.trim());
                    current = "";
                    continue;
                }
            }
            current += c;
        }
        if (current.trim()) tokens.push(current.trim());

        return tokens.map((token) => this.parseToken(token));
    }

    private parseToken(token: string): any {
        if (token === "true") return true;
        if (token === "false") return false;
        if (token === "null") return null;
        if (token === "undefined") return undefined;
        if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
        if (
            (token.startsWith("'") && token.endsWith("'")) ||
            (token.startsWith("\"") && token.endsWith("\""))
        ) {
            return token.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, "\"");
        }
        return token;
    }

    public processEffects(effects: any[], componentId?: string) {
        if (!Array.isArray(effects)) return;

        const scopeRoot = componentId
            ? (document.querySelector(`[wire\\:id="${componentId}"], [wire-id="${componentId}"]`) as HTMLElement | null)
            : null;
        const queryScope: ParentNode = scopeRoot || document;

        for (let i = 0; i < effects.length; i++) {
            const effect = effects[i];
            if (!effect || !effect.type) continue;

            switch (effect.type) {
                case "redirect":
                    window.location.href = effect.payload;
                    return;
                case "event": {
                    const { name, params } = effect.payload || {};
                    const payload = Array.isArray(params)
                        ? (params.length <= 1 ? params[0] : params)
                        : params;
                    this.emitSync(name, payload);
                    if (typeof window !== "undefined" && name) {
                        window.dispatchEvent(new CustomEvent(String(name), { detail: payload }));
                        window.dispatchEvent(new CustomEvent(`wire:${String(name)}`, { detail: payload }));
                    }
                    break;
                }
                case "stream": {
                    const { target, content, method } = effect.payload || {};
                    if (!target || typeof target !== "string") break;

                    let el = queryScope.querySelector(target);
                    if (!el) {
                        const value = target.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
                        el = queryScope.querySelector(`[wire\\:stream="${value}"]`);
                    }
                    if (!el) break;

                    if (method === "append") el.insertAdjacentHTML("beforeend", content || "");
                    else if (method === "prepend") el.insertAdjacentHTML("afterbegin", content || "");
                    else el.innerHTML = content || "";
                    break;
                }
            }
        }
    }

    public getMetadata(el: HTMLElement) {
        let root: HTMLElement | null =
            el.hasAttribute("wire:id") || el.hasAttribute("wire-id") ? el : null;
        if (!root) {
            root = el.closest("[wire\\:id], [wire-id], [wire\\:state]") as HTMLElement | null;
        }
        if (!root) return null;

        const id = root.getAttribute("wire:id") || root.getAttribute("wire-id");
        if (!id) return null;

        const stateStr = root.getAttribute("wire:state");
        let state: any = {};
        if (stateStr) {
            try {
                state = JSON.parse(stateStr);
            } catch {
                state = {};
            }
        }

        return { el: root, id, state };
    }

    public getComponentId(el: HTMLElement): string | null {
        if (el.hasAttribute("wire:id")) return el.getAttribute("wire:id");
        if (el.hasAttribute("wire-id")) return el.getAttribute("wire-id");
        const root = el.closest("[wire\\:id], [wire-id]");
        return root ? (root.getAttribute("wire:id") || root.getAttribute("wire-id")) : null;
    }

    public getComponentState(el: HTMLElement): any {
        const meta = this.getMetadata(el);
        return meta ? meta.state : {};
    }

    private getComponentProxy(el: HTMLElement) {
        const id = this.getComponentId(el);
        return id ? this.components.get(id) : null;
    }

    private createProxy(id: string, el: HTMLElement) {
        const wire = this;
        const internalTarget: any = {};

        return new Proxy(internalTarget, {
            get(target: any, prop: string) {
                if (prop === "$id") return id;
                if (prop === "$el") return el;
                if (prop === "__target") return target;

                if (prop in target) return target[prop];
                const state = wire.getComponentState(el);
                if (prop in state) return state[prop];

                return (...args: any[]) => {
                    const root = document.querySelector(`[wire\\:id="${id}"], [wire-id="${id}"]`);
                    if (root) return wire.call(root as HTMLElement, prop, args);
                    return wire.call(el, prop, args);
                };
            },
            set(target: any, prop: string, value: any) {
                target[prop] = value;
                wire.defer(id, String(prop), value);
                return true;
            },
        });
    }

    public patch(el: HTMLElement, newHtml: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(newHtml, "text/html");
        const newEl = doc.body.firstElementChild as HTMLElement;
        if (newEl) (window as any).Alpine.morph(el, newEl);
    }

    public $on(event: string, callback: Listener): () => void {
        return this.on(event, callback);
    }

    public $emit(event: string, data?: any) {
        this.emitSync(event, data);
    }

    public beginNavigation() {
        this.navigationInFlight = true;
        this.bus.cancelPending(new Error("Cancelled due to navigation"));
        if (this.adapter && typeof this.adapter.abortAllRequests === "function") {
            this.adapter.abortAllRequests();
        }
    }

    public endNavigation() {
        this.navigationInFlight = false;
    }

    public isNavigating() {
        return this.navigationInFlight;
    }

    public resetClientState() {
        this.components.clear();
        this.deferredUpdates.clear();
    }

    private setupRemovalObserver() {
        if (this.observer || typeof MutationObserver === "undefined" || !document.body) return;

        this.observer = new MutationObserver((records) => {
            for (let i = 0; i < records.length; i++) {
                const removed = records[i]!.removedNodes;
                for (let j = 0; j < removed.length; j++) {
                    this.runNodeCleanup(removed[j]!);
                }
            }
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    private runNodeCleanup(node: Node) {
        if (!(node instanceof HTMLElement)) return;
        this.runElementCleanup(node);

        const children = node.querySelectorAll("*");
        for (let i = 0; i < children.length; i++) {
            this.runElementCleanup(children[i] as HTMLElement);
        }
    }

    private runElementCleanup(el: HTMLElement) {
        const cleanups = this.cleanupByElement.get(el);
        if (!cleanups) return;

        this.cleanupByElement.delete(el);
        delete (el as any)._kirewire_init;

        for (let i = 0; i < cleanups.length; i++) {
            try {
                cleanups[i]!();
            } catch {
                // Ignore cleanup errors to avoid breaking DOM teardown.
            }
        }
    }
}

export const Kirewire = new KirewireClient();
(typeof global !== "undefined" ? global : (window as any)).Kirewire = Kirewire;
