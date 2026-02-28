import morph from '@alpinejs/morph';
import Alpine from 'alpinejs';
import { bus } from "./utils/message-bus";

(window as any).Alpine = Alpine;

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
    
    /**
     * Pending deferred updates for components.
     * ComponentId -> { property: value }
     */
    private deferredUpdates = new Map<string, Record<string, any>>();

    constructor() {}

    public directive(name: string, handler: WireClientDirective) {
        console.log(`[Kirewire] Registering directive handler: ${name}`);
        this.directives.set(name, handler);
    }

    public start(Alpine: any) {
        console.log(`[Kirewire] Booting Alpine integration...`);
        (window as any).Alpine = Alpine;
        Alpine.plugin(morph);

        Alpine.magic('wire', (el: HTMLElement) => {
            return this.getComponentProxy(el);
        });

        Alpine.addRootSelector(() => "[wire\\:id]");

        Alpine.interceptInit(Alpine.skipDuringClone((el: HTMLElement) => {
            const componentId = this.getComponentId(el);
            if (!componentId) return;

            if (!this.components.has(componentId)) {
                this.components.set(componentId, this.createProxy(componentId, el));
            }

            this.attachWireToDataScopes(el, componentId);
            this.processWireAttributes(el);
        }));

        if (!(window as any).Alpine.started) {
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

    public defer(componentId: string, property: string, value: any) {
        console.log(`[Kirewire] Deferring update for "${componentId}": ${property} =`, value);
        let updates = this.deferredUpdates.get(componentId);
        if (!updates) {
            updates = {};
            this.deferredUpdates.set(componentId, updates);
        }
        updates[property] = value;
    }

    /**
     * Centralized method to call a component action.
     */
    public async call(el: HTMLElement, method: string, params: any[] = []) {
        const meta = this.getMetadata(el);
        if (!meta) return;

        console.log(`[Kirewire] Preparing call: "${method}" on "${meta.id}"`);

        // 1. Process deferred updates first
        const deferred = this.deferredUpdates.get(meta.id);
        if (deferred) {
            console.log(`[Kirewire] Flushing deferred updates for "${meta.id}" before action.`);
            for (const [prop, val] of Object.entries(deferred)) {
                // Enqueue $set actions into the same bus cycle
                bus.enqueue({
                    id: meta.id,
                    method: '$set',
                    params: [prop, val],
                    state: meta.state,
                    checksum: meta.checksum,
                    pageId: this.pageId
                });
            }
            this.deferredUpdates.delete(meta.id);
        }

        // 2. Enqueue the main action
        this.$emit('component:call', { id: meta.id, method, params });

        try {
            const result = await bus.enqueue({
                id: meta.id,
                method,
                params,
                state: meta.state,
                checksum: meta.checksum,
                pageId: this.pageId
            });

            if (result.success) {
                if (result.state) meta.el.setAttribute('wire:state', JSON.stringify(result.state));
                if (result.checksum) meta.el.setAttribute('wire:checksum', result.checksum);
                if (result.html) this.patch(meta.el, result.html);
                if (result.state) this.$emit('component:update', { id: meta.id, state: result.state, checksum: result.checksum });
            }
        } catch (e) {
            console.error(`[Kirewire] Action failed:`, e);
            this.$emit('component:error', { id: meta.id, error: e });
        } finally {
            this.$emit('component:finished', { id: meta.id });
        }
    }

    private getComponentId(el: HTMLElement): string | null {
        const root = el.closest('[wire\\:id], [wire-id]');
        return root?.getAttribute('wire:id') || root?.getAttribute('wire-id') || null;
    }

    private createProxy(id: string, el: HTMLElement) {
        const wire = this;
        return new Proxy({}, {
            get(target, prop: string) {
                if (prop === '$id') return id;
                if (prop === '$el') return el;
                return (...args: any[]) => {
                    const root = document.querySelector(`[wire\\:id="${id}"]`);
                    if (root) return wire.call(root as HTMLElement, prop, args);
                };
            }
        });
    }

    public getMetadata(el: HTMLElement) {
        const root = el.closest('[wire\\:id], [wire-id]');
        if (!root) return null;
        return {
            el: root as HTMLElement,
            id: root.getAttribute('wire:id') || root.getAttribute('wire-id')!,
            state: JSON.parse(root.getAttribute('wire:state') || '{}'),
            checksum: root.getAttribute('wire:checksum')
        };
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
        const handlers = this.events.get(event);
        if (handlers) { handlers.forEach(h => h(data)); }
    }

    public patch(el: HTMLElement, newHtml: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(newHtml, "text/html");
        const newEl = doc.body.firstElementChild as HTMLElement;
        if (newEl) (window as any).Alpine.morph(el, newEl);
    }
}

export const Kirewire = new KirewireClient();
(window as any).Kirewire = Kirewire;
