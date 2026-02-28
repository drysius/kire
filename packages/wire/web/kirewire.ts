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

    constructor() {}

    /**
     * Registers a new client-side wire directive.
     */
    public directive(name: string, handler: WireClientDirective) {
        console.log(`[Kirewire] Registering directive: wire:${name}`);
        this.directives.set(name, handler);
    }

    public start(Alpine: any) {
        console.log(`[Kirewire] Starting Alpine integration...`);
        (window as any).Alpine = Alpine;
        Alpine.plugin(morph);

        // Magic $wire: allows access to the component instance from Alpine
        Alpine.magic('wire', (el: HTMLElement) => {
            const componentId = this.getComponentId(el);
            console.log(`[Kirewire] Magic $wire accessed for component: ${componentId}`);
            return componentId ? this.components.get(componentId) : null;
        });

        Alpine.directive('wire', (el: HTMLElement, { value, expression, modifiers }: any, { cleanup }: any) => {
            console.log(`[Kirewire] Binding wire:${value}="${expression}" on`, el);
            const handler = this.directives.get(value);
            if (handler) {
                handler({ el, value, expression, modifiers, cleanup, wire: this });
            } else {
                console.warn(`[Kirewire] No handler found for directive: wire:${value}`);
            }
        });

        // Start Alpine if not already started
        if (!(window as any).Alpine.started) {
            console.log(`[Kirewire] Forcing Alpine.start()`);
            Alpine.start();
        }

        this.$emit('wire:ready', {});
    }

    /**
     * Centralized method to call a component action.
     */
    public async call(el: HTMLElement, method: string, params: any[] = []) {
        const meta = this.getMetadata(el);
        if (!meta) {
            console.error(`[Kirewire] Could not find component metadata for element:`, el);
            return;
        }

        console.log(`[Kirewire] Calling "${method}" on component "${meta.id}" with params:`, params);
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
                console.log(`[Kirewire] Action "${method}" succeeded for "${meta.id}". Updating DOM.`);
                // Update state and checksum on the element
                meta.el.setAttribute('wire:state', JSON.stringify(result.state));
                meta.el.setAttribute('wire:checksum', result.checksum);
                
                if (result.html) {
                    this.patch(meta.el, result.html);
                }

                this.$emit('component:update', { id: meta.id, state: result.state, checksum: result.checksum });
            } else if (result.error) {
                console.error(`[Kirewire] Server returned error for "${method}":`, result.error);
            }
        } catch (e) {
            console.error(`[Kirewire] Action "${method}" failed at transport level:`, e);
            this.$emit('component:error', { id: meta.id, error: e });
        } finally {
            this.$emit('component:finished', { id: meta.id });
        }
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

    public getComponentId(el: HTMLElement): string | null {
        const root = el.closest('[wire\\:id], [wire-id]');
        return root?.getAttribute('wire:id') || root?.getAttribute('wire-id') || null;
    }

    public getComponentState(el: HTMLElement): any {
        const root = el.closest('[wire\\:id], [wire-id]');
        return JSON.parse(root?.getAttribute('wire:state') || '{}');
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
        (window as any).Alpine.morph(el, newHtml);
    }
}

export const Kirewire = new KirewireClient();
(window as any).Kirewire = Kirewire;
