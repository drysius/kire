import Alpine from "alpinejs";
import { messageBus } from "./message-bus";

/**
 * Robust Client-side Wire Component.
 */
export class Component {
    public id: string;
    public name: string;
    public state: any;
    public checksum: string;
    public el: HTMLElement;
    
    private canonicalState: any;
    public __activeRequests = 0;
    public __pendingUpdates: Record<string, any> = {};

    constructor(el: HTMLElement) {
        this.el = el;
        this.id = el.getAttribute("wire:id")!;
        this.name = el.getAttribute("wire:component")!;
        this.checksum = el.getAttribute("wire:checksum") || "";
        
        const initialState = JSON.parse(el.getAttribute("wire:state") || "{}");
        this.canonicalState = JSON.parse(JSON.stringify(initialState));
        this.state = Alpine.reactive(initialState);

        return new Proxy(this, {
            get: (target, prop: string) => {
                if (prop in target) return (target as any)[prop];
                return target.state[prop];
            },
            set: (target, prop: string, value) => {
                if (prop in target) {
                    (target as any)[prop] = value;
                } else {
                    target.state[prop] = value;
                    target.__pendingUpdates[prop] = value;
                }
                return true;
            }
        });
    }

    get __isLoading() { return this.__activeRequests > 0; }

    async call(method: string, ...params: any[]) {
        this.__activeRequests++;
        
        const updates = { ...this.__pendingUpdates };
        for (const key in this.state) {
            if (JSON.stringify(this.state[key]) !== JSON.stringify(this.canonicalState[key])) {
                updates[key] = this.state[key];
            }
        }
        this.__pendingUpdates = {};

        try {
            const result = await messageBus.enqueue(this.id, {
                id: this.id,
                component: this.name,
                method,
                params,
                state: this.canonicalState,
                updates,
                checksum: this.checksum
            });

            this._applyResponse(result);
        } catch (e) {
            console.error(`[Wire] Action "${method}" failed:`, e);
        } finally {
            this.__activeRequests--;
        }
    }

    _applyResponse(result: any) {
        if (!result) return;
        const effects = result.effects || {};

        if (effects.redirect) {
            window.location.href = effects.redirect;
            return;
        }

        if (result.state) {
            this.canonicalState = JSON.parse(JSON.stringify(result.state));
            Object.assign(this.state, result.state);
        }
        
        if (result.checksum) this.checksum = result.checksum;

        if (effects.events) {
            effects.events.forEach((e: any) => window.dispatchEvent(new CustomEvent(e.name, { detail: e.params })));
        }

        if (effects.streams) {
            effects.streams.forEach((s: any) => this._handleStream(s));
        }

        if (result.html) {
            this.morph(result.html);
        }
    }

    _handleStream(s: any) {
        const targets = document.querySelectorAll(`[wire\\:stream="${s.target}"]`);
        targets.forEach((el: any) => {
            if (s.replace) el.outerHTML = s.content;
            else {
                const m = s.method || 'update';
                if (m === 'append') el.insertAdjacentHTML('beforeend', s.content);
                else if (m === 'prepend') el.insertAdjacentHTML('afterbegin', s.content);
                else if (m === 'remove') el.remove();
                else el.innerHTML = s.content;
            }
        });
    }

    morph(html: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newEl = doc.body.firstElementChild as HTMLElement;
        
        if (newEl) {
            // @ts-expect-error Alpine morph
            Alpine.morph(this.el, newEl, {
                key: (el: any) => el.getAttribute?.("wire:id") || el.getAttribute?.("wire:key") || el.id,
                updating: (el: any, toEl: any, childrenOnly: any, skip: any) => {
                    // Critical: Preserve the component reference during morph
                    if (el === this.el) {
                        (toEl as any).__wire = this;
                        (toEl as any).__wire_initialized = true;
                    }
                    if (el.hasAttribute && (el.hasAttribute("wire:ignore") || el.hasAttribute("wire:ignore-self"))) return skip();
                    if (el === document.activeElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return skip();
                }
            });
        }
    }
}
