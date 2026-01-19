import type { WireRequest, WireResponse } from "../../types";
import type { ClientAdapter } from "../../adapters/http";

export class Component {
    public id: string;
    public name: string;
    public snapshot: any;
    public data: any;
    
    constructor(public el: HTMLElement, snapshot: string, public config: any, public adapter: ClientAdapter) {
        this.snapshot = JSON.parse(snapshot);
        this.id = this.snapshot.memo.id;
        this.name = this.snapshot.memo.name;
        this.data = this.snapshot.data;
    }

    async call(method: string, params: any[] = []) {
        return this.sendRequest({ method, params });
    }

    async update(updates: Record<string, any>) {
        return this.sendRequest({ method: '$set', params: [], updates });
    }

    private async sendRequest(payload: Partial<WireRequest>) {
        const fullPayload: WireRequest = {
            component: this.name,
            snapshot: JSON.stringify(this.snapshot),
            method: payload.method || '$refresh',
            params: payload.params || [],
            updates: payload.updates,
            _token: this.getCsrfToken() // Keep strictly for payload token if needed
        };

        this.setLoading(true, payload.method);

        try {
            const response: WireResponse = await this.adapter.request(fullPayload);
            this.handleResponse(response, payload.method);

        } catch (e) {
            console.error(e);
        } finally {
            this.setLoading(false, payload.method);
        }
    }

    private handleResponse(response: WireResponse, method?: string) {
        if (!response.components) return;

        response.components.forEach(comp => {
            const snapObj = JSON.parse(comp.snapshot);
            
            if (snapObj.memo.id === this.id) {
                this.snapshot = snapObj;
                this.data = snapObj.data;
                // Sync back to Alpine if needed (handled by Alpine reactivity usually)
            }

            if (comp.effects.redirect) window.location.href = comp.effects.redirect;

            if (comp.effects.html) {
                this.morph(comp.effects.html, comp.snapshot, method === '$refresh');
            }
            
            if (comp.effects.emits) {
                comp.effects.emits.forEach((e: any) => {
                    window.dispatchEvent(new CustomEvent(e.event, { detail: e.params }));
                });
            }
        });
    }
// ... remainder of file unchanged (morph, setLoading, getCsrfToken)

    private morph(html: string, newSnapshot: string, isPoll: boolean) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newEl = doc.body.firstElementChild as HTMLElement;

        if (!newEl) return;
        newEl.setAttribute("wire:snapshot", newSnapshot);

        (window as any).Alpine.morph(this.el, newEl, {
            updating: (el: any, toEl: any, childrenOnly: any, skip: any) => {
                if (el instanceof Element && el.hasAttribute("wire:ignore")) return skip();
                if (el === document.activeElement) return skip();

                // Input preservation
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                    if (toEl instanceof Element && el.hasAttribute("wire:model")) {
                        if (isPoll) {
                            (toEl as any).value = el.value;
                            if (toEl.hasAttribute("value")) toEl.setAttribute("value", el.value);
                        }
                    }
                }
            },
            key: (el: any) => {
                if (typeof el.hasAttribute !== 'function') return;
                return el.hasAttribute(`wire:id`)
                    ? el.getAttribute(`wire:id`)
                    : el.hasAttribute(`wire:key`)
                        ? el.getAttribute(`wire:key`)
                        : el.id
            }
        });
    }

    private setLoading(loading: boolean, target?: string) {
        if (loading) this.el.setAttribute('wire:loading-state', 'true');
        else this.el.removeAttribute('wire:loading-state');

        window.dispatchEvent(new CustomEvent('wire:loading', { 
            detail: { id: this.id, loading, target } 
        }));
    }

    private getCsrfToken() {
        return document.querySelector(`meta[name="${this.config.csrf || 'csrf-token'}"]`)?.getAttribute('content') || undefined;
    }
}
