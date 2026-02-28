import morph from '@alpinejs/morph';

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

    constructor() {}

    public directive(name: string, handler: WireClientDirective) {
        this.directives.set(name, handler);
    }

    public start(Alpine: any) {
        (window as any).Alpine = Alpine;
        Alpine.plugin(morph);

        Alpine.directive('wire', (el: HTMLElement, { value, expression, modifiers }: any, { cleanup }: any) => {
            const handler = this.directives.get(value);
            if (handler) {
                handler({ el, value, expression, modifiers, cleanup, wire: this });
            }
        });
    }

    public $on(event: string, callback: (data: any) => void) {
        const names = event.split(',').map(n => n.trim());
        for (const name of names) {
            if (!this.events.has(name)) this.events.set(name, []);
            this.events.get(name)!.push(callback);
        }
    }

    public $emit(event: string, data: any) {
        const handlers = this.events.get(event);
        if (handlers) { handlers.forEach(h => h(data)); }
    }

    public patch(el: HTMLElement, newHtml: string) {
        (window as any).Alpine.morph(el, newHtml);
    }
}

export const wire = new KirewireClient();
(window as any).Kirewire = wire;
