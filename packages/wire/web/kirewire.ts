import morph from '@alpinejs/morph';
import { bus } from "./utils/message-bus";

console.log("[Kirewire] wire.js loaded");

export interface WireClientContext {
    el: HTMLElement;
    value: string;
    expression: string;
    modifiers: string[];
    cleanup: (fn: () => void) => void;
    wire: KirewireClient;
}

export type WireClientDirective = (ctx: WireClientContext) => void;

export class KirewireClient {
    private events = new Map<string, Array<(data: any) => void>>();
    private directives = new Map<string, WireClientDirective>();
    public components = new Map<string, any>();
    public pageId: string = 'default';
    public bus = bus;
    
    private deferredUpdates = new Map<string, Record<string, any>>();

    constructor() {}

    public directive(name: string, handler: WireClientDirective) {
        this.directives.set(name, handler);
    }

    public getDirective(name: string): WireClientDirective | undefined {
        return this.directives.get(name);
    }

    public start(Alpine: any) {
        console.log("[Kirewire] Starting client-side engine...");
        if (!Alpine) {
            console.error("[Kirewire] Alpine instance is required to start.");
            return;
        }
        (window as any).Alpine = Alpine;
        Alpine.plugin(morph);

        Alpine.magic('wire', (el: HTMLElement) => {
            return this.getComponentProxy(el);
        });

        Alpine.addRootSelector(() => "[wire\\:id]");

        Alpine.interceptInit(Alpine.skipDuringClone((el: HTMLElement) => {
            const componentId = this.getComponentId(el);
            if (!componentId) return;

            console.log(`[Kirewire] Initializing component scope for "${componentId}"`);

            if (!this.components.has(componentId)) {
                this.components.set(componentId, this.createProxy(componentId, el));
            }

            this.attachWireToDataScopes(el, componentId);
            this.processWireAttributes(el);
        }));

        // NEW: Keep proxy in sync with server state
        this.$on('component:update', (data) => {
            const proxy = this.components.get(data.id);
            if (proxy && (proxy as any).__target) {
                // Clear dirty local state because server is now the source of truth
                const target = (proxy as any).__target;
                for (const key in target) delete target[key];
            }
        });

        if (!Alpine.started) {
            Alpine.start();
        }

        this.$emit('wire:ready', {});
    }

    private processWireAttributes(el: HTMLElement) {
        if ((el as any)._kirewire_init) return;
        (el as any)._kirewire_init = true;

        const attrs = el.getAttributeNames();
        for (const attrName of attrs) {
            if (!attrName.startsWith('wire:')) continue;

            const parts = attrName.slice(5).split('.');
            const value = parts[0]!;
            const modifiers = parts.slice(1);
            const expression = el.getAttribute(attrName) || '';

            const handler = this.directives.get(value);
            if (handler) {
                console.log(`[Kirewire] Applying directive "wire:${value}" to`, el);
                handler({ el, value, expression, modifiers, cleanup: (fn) => {}, wire: this });
            }
        }
    }

    private attachWireToDataScopes(el: HTMLElement, componentId: string) {
        const bind = () => {
            const scopes = (el as any)._x_dataStack;
            if (!Array.isArray(scopes)) return;
            const proxy = this.components.get(componentId);
            for (const scope of scopes) {
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

    public defer(target: string | HTMLElement, property: string, value: any) {
        const componentId = typeof target === 'string' ? target : this.getComponentId(target);
        if (!componentId) {
            console.warn(`[Kirewire] defer() failed: could not find component ID for`, target);
            return;
        }

        console.log(`[Kirewire] defer() queued update for "${componentId}": ${property} =`, value);

        let updates = this.deferredUpdates.get(componentId);
        if (!updates) {
            updates = {};
            this.deferredUpdates.set(componentId, updates);
        }
        updates[property] = value;
        
        const proxy = this.components.get(componentId);
        if (proxy && (proxy as any).__target) {
            (proxy as any).__target[property] = value;
        }
    }

    public async call(el: HTMLElement, method: string, params: any[] = []) {
        const meta = this.getMetadata(el);
        if (!meta) {
            console.error("[Kirewire] Cannot call method: no component metadata found for element.", el);
            return;
        }

        const normalized = this.normalizeAction(method, params);
        const actionMethod = normalized.method;
        const actionParams = normalized.params;
        const componentId = meta.id; // This is the ID currently in the DOM
        console.log(`[Kirewire] --- STARTING ACTION CALL: "${actionMethod}" on "${componentId}" ---`);

        // Check for deferred updates using the FRESH ID from DOM
        const deferred = this.deferredUpdates.get(componentId);
        const actionsToEnqueue = [];

        if (deferred) {
            console.log(`[Kirewire] Found ${Object.keys(deferred).length} deferred updates for "${componentId}":`, deferred);
            for (const [prop, val] of Object.entries(deferred)) {
                actionsToEnqueue.push({
                    id: componentId, 
                    method: '$set', 
                    params: [prop, val],
                    state: meta.state, 
                    checksum: meta.checksum, 
                    pageId: this.pageId
                });
            }
            this.deferredUpdates.delete(componentId);
        }

        // Add the main action
        actionsToEnqueue.push({
            id: componentId, 
            method: actionMethod, 
            params: actionParams,
            state: meta.state, 
            checksum: meta.checksum, 
            pageId: this.pageId
        });

        this.$emit('component:call', { id: componentId, method: actionMethod, params: actionParams });

        try {
            // Enqueue all actions. The MessageBus delay will naturally batch them 
            // into a single HTTP request because they are added in the same microtask.
            console.log(`[Kirewire] Enqueuing ${actionsToEnqueue.length} actions to MessageBus...`);
            
            const promises = actionsToEnqueue.map(action => this.bus.enqueue(action));
            
            // The result of the call is usually the last promise (the main method)
            const results = await Promise.all(promises);
            const mainResult = results[results.length - 1];

            // 3. Process side effects (Events, Redirects, etc.)
            if (mainResult && mainResult.effects) {
                this.processEffects(mainResult.effects, componentId);
            }

            console.log(`[Kirewire] --- ACTION CALL FINISHED: "${actionMethod}" on "${componentId}" ---`);
            return mainResult;
        } catch (e) {
            console.error(`[Kirewire] Action failed for "${componentId}":`, e);
            this.$emit('component:error', { id: componentId, error: e });
        } finally {
            this.$emit('component:finished', { id: componentId });
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
                if (c === '"' || c === "'") inQ = c;
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
        if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
            return token.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
        }
        return token;
    }

    /**
     * Processes side effects sent by the server.
     */
    public processEffects(effects: any, componentId?: string) {
        if (!effects) return;

        // 1. Handle Redirect
        if (effects.redirect) {
            console.log(`[Kirewire] Redirecting to: ${effects.redirect}`);
            window.location.href = effects.redirect;
            return; // Stop processing if redirecting
        }

        // 2. Handle Events (Emits)
        if (Array.isArray(effects.events)) {
            for (const event of effects.events) {
                console.log(`[Kirewire] Server emitted event: "${event.name}" with params:`, event.params);
                this.$emit(event.name, ...event.params);
            }
        }

        // 3. Handle DOM Streams
        if (Array.isArray(effects.streams)) {
            for (const stream of effects.streams) {
                const target = document.querySelector(stream.target);
                if (target) {
                    console.log(`[Kirewire] Streaming update to "${stream.target}" using method "${stream.method}"`);
                    if (stream.method === 'update') target.innerHTML = stream.content;
                    else if (stream.method === 'append') target.insertAdjacentHTML('beforeend', stream.content);
                    else if (stream.method === 'prepend') target.insertAdjacentHTML('afterbegin', stream.content);
                }
            }
        }
    }

    public getMetadata(el: HTMLElement) {
        // 1. Check if the element itself is the root
        let root: HTMLElement | null = el.hasAttribute('wire:id') || el.hasAttribute('wire-id') ? el : null;
        
        // 2. If not, look up the tree
        if (!root) {
            root = el.closest('[wire\\:id], [wire-id], [wire\\:state]') as HTMLElement;
        }

        if (!root) return null;
        
        const id = root.getAttribute('wire:id') || root.getAttribute('wire-id');
        const stateStr = root.getAttribute('wire:state');
        const checksum = root.getAttribute('wire:checksum');

        if (!id || !stateStr) return null;

        try {
            return {
                el: root,
                id,
                state: JSON.parse(stateStr),
                checksum
            };
        } catch (e) {
            console.error("[Kirewire] Failed to parse component state:", stateStr);
            return null;
        }
    }

    public getComponentId(el: HTMLElement): string | null {
        if (el.hasAttribute('wire:id')) return el.getAttribute('wire:id');
        if (el.hasAttribute('wire-id')) return el.getAttribute('wire-id');
        const root = el.closest('[wire\\:id], [wire-id]');
        return root ? (root.getAttribute('wire:id') || root.getAttribute('wire-id')) : null;
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
                if (prop === '$id') return id;
                if (prop === '$el') return el;
                if (prop === '__target') return target; 
                
                if (prop in target) return target[prop];
                const state = wire.getComponentState(el);
                if (prop in state) return state[prop];
                return (...args: any[]) => {
                    // Try to find the root element for this component
                    const root = document.querySelector(`[wire\\:id="${id}"], [wire-id="${id}"]`);
                    if (root) return wire.call(root as HTMLElement, prop, args);
                    // Fallback to the element provided during proxy creation
                    return wire.call(el, prop, args);
                };
            },
            set(target: any, prop: string, value: any) {
                console.log(`[Kirewire] Proxy: Setting "${prop}" to`, value, `on component "${id}"`);
                target[prop] = value;
                wire.defer(id, prop, value);
                return true;
            }
        });
    }

    public $on(event: string, callback: (data: any) => void): () => void {
        const names = event.split(',').map(n => n.trim());
        const unregisters: Array<() => void> = [];
        for (const name of names) {
            if (!this.events.has(name)) this.events.set(name, []);
            const handlers = this.events.get(name)!;
            handlers.push(callback);
            unregisters.push(() => {
                const idx = handlers.indexOf(callback);
                if (idx !== -1) handlers.splice(idx, 1);
            });
        }
        return () => unregisters.forEach(u => u());
    }

    public $emit(event: string, data: any) {
        console.log(`[Kirewire] Event Emitted: "${event}"`, data);
        const handlers = this.events.get(event);
        if (handlers) { handlers.forEach(h => h(data)); }
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(`wire:${event}`, { detail: data }));
        }
    }

    public patch(el: HTMLElement, newHtml: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(newHtml, "text/html");
        const newEl = doc.body.firstElementChild as HTMLElement;
        if (newEl) (window as any).Alpine.morph(el, newEl);
    }
}

export const Kirewire = new KirewireClient();
(typeof global !== "undefined" ? global : window as any).Kirewire = Kirewire;
