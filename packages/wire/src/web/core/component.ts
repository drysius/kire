import type { WireRequest, WireResponse } from "../../types";
import type { ClientAdapter } from "../../adapters/http";

export class Component {
    public id: string;
    public name: string;
    public snapshot: any;
    public data: any;
    private cleanupFns: Function[] = [];
    public activeRequests = new Set<string>();
    private pendingUpdates: Record<string, any> = {};
    
    constructor(public el: HTMLElement, snapshot: string | null, public config: any, public adapter: ClientAdapter) {
        if (snapshot) {
            this.snapshot = JSON.parse(snapshot);
            this.id = this.snapshot.memo.id;
            this.name = this.snapshot.memo.name;
            this.data = this.snapshot.data;
        } else {
            this.id = el.getAttribute('wire:id') || '';
            this.name = el.getAttribute('wire:component') || '';
            this.data = {};
            this.snapshot = null;
        }
        
        this.initListeners();
    }

    public async loadLazy() {
        const paramsJson = this.el.getAttribute('wire:init-params');
        const params = paramsJson ? JSON.parse(paramsJson) : {};

        const fullPayload: any = {
            component: this.name,
            id: this.id,
            method: '$refresh',
            params: [],
            // Passing initial params for mount
            updates: params, 
            _token: this.getCsrfToken()
        };

        this.setLoading(true, '$lazy');

        try {
            const response: WireResponse = await this.adapter.request(fullPayload);
            this.handleResponse(response, '$refresh');
        } catch (e) {
            console.error(e);
        } finally {
            this.setLoading(false, '$lazy');
        }
    }
    
    private initListeners() {
        if (!this.snapshot) return;
        const listeners = this.snapshot.memo.listeners || {};
        Object.entries(listeners).forEach(([event, method]) => {
            const handler = (e: any) => {
                const params = e.detail ?? [];
                const args = Array.isArray(params) ? params : [params];
                this.call(method as string, args);
            };
            
            window.addEventListener(event, handler);
            this.cleanupFns.push(() => window.removeEventListener(event, handler));
        });
    }

    public cleanup() {
        this.cleanupFns.forEach(fn => fn());
        this.cleanupFns = [];
    }

    async call(method: string, params: any[] = []) {
        return this.sendRequest({ method, params });
    }

    async update(updates: Record<string, any>) {
        return this.sendRequest({ method: '$set', params: [], updates });
    }

    async deferUpdate(updates: Record<string, any>) {
        Object.assign(this.pendingUpdates, updates);
    }

    private async sendRequest(payload: Partial<WireRequest>) {
        const updates = { ...this.pendingUpdates, ...payload.updates };
        this.pendingUpdates = {};

        const fullPayload: WireRequest = {
            component: this.name,
            snapshot: JSON.stringify(this.snapshot),
            method: payload.method || '$refresh',
            params: payload.params || [],
            updates: Object.keys(updates).length > 0 ? updates : undefined,
            _token: this.getCsrfToken() // Keep strictly for payload token if needed
        };

        this.setLoading(true, payload.method);

        try {
            const response: WireResponse = await this.adapter.request(fullPayload);
            this.handleResponse(response, payload.method);

        } catch (e) {
            console.error(e);
             // Restore pending updates on failure? (Optional optimization)
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
            
            if (comp.effects.url) {
                const currentUrl = new URL(window.location.href);
                // Merge new query params
                const newParams = new URLSearchParams(comp.effects.url);
                newParams.forEach((v, k) => currentUrl.searchParams.set(k, v));
                // Clean empty
                // history.pushState({}, '', currentUrl.toString());
                // Livewire style: replaceState or pushState depending on config, usually push
                window.history.pushState({}, '', '?' + newParams.toString());
            }

            if (comp.effects.html) {
                this.morph(comp.effects.html, comp.snapshot, method === '$refresh');
            }
            
            // Dispatch update event for Entangle
            window.dispatchEvent(new CustomEvent(`wire:update:${this.id}`, { 
                detail: this.data 
            }));

            if (comp.effects.emits) {
                comp.effects.emits.forEach((e: any) => {
                    window.dispatchEvent(new CustomEvent(e.event, { detail: e.params }));
                });
            }

            // Handle Streams (if present in effects)
            if ((comp.effects as any).streams) {
                (comp.effects as any).streams.forEach((stream: any) => this.processStream(stream));
            }
        });
    }

    private processStream(stream: { target: string, content: string, replace?: boolean, method?: string }) {
        const targets = document.querySelectorAll(`[wire\\:stream="${stream.target}"]`);
        targets.forEach(el => {
            if (stream.replace) {
                el.outerHTML = stream.content;
            } else {
                const method = stream.method || 'append';
                if (method === 'append') el.insertAdjacentHTML('beforeend', stream.content);
                if (method === 'prepend') el.insertAdjacentHTML('afterbegin', stream.content);
                if (method === 'remove') el.remove();
                if (method === 'update') el.innerHTML = stream.content;
            }
        });
    }

    private morph(html: string, newSnapshot: string, isPoll: boolean) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const newEl = doc.body.firstElementChild as HTMLElement;

        if (!newEl) return;
        newEl.setAttribute("wire:snapshot", newSnapshot);

        (window as any).Alpine.morph(this.el, newEl, {
            updating: (el: any, toEl: any, childrenOnly: any, skip: any) => {
                if (el instanceof Element && el.hasAttribute("wire:ignore")) return skip();

                // Input preservation logic
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                    if (toEl instanceof Element && el.hasAttribute("wire:model")) {
                        // If it's a polling update, we generally want to force update values
                        // unless specifically protected (Livewire doesn't typically protect poll updates on models)
                        if (isPoll) return;

                        // Check if value changed on server
                        const newValue = toEl.getAttribute("value");
                        const currentValue = el.value;

                        // If the server value is effectively the same as current value,
                        // we skip DOM update to preserve cursor position / selection state.
                        if (newValue === currentValue) {
                            return skip();
                        }
                        
                        // If values are different (e.g. server cleared the input),
                        // we allow the update to proceed (no skip).
                        return;
                    }
                }
                
                // For other active elements (not models we just handled), skip to avoid interrupting user
                if (el === document.activeElement) return skip();
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
        // Use a unique key for each request type to allow concurrency tracking
        // If target is undefined (global), we use 'global'
        // If target is '$set', we might want to differentiate *which* property?
        // For now, simple target tracking.
        const key = target || 'global';
        
        if (loading) {
            this.activeRequests.add(key);
            this.el.setAttribute('wire:loading-state', 'true');
        } else {
            this.activeRequests.delete(key);
            if (this.activeRequests.size === 0) {
                this.el.removeAttribute('wire:loading-state');
            }
        }
        
        const anyLoading = this.activeRequests.size > 0;

        window.dispatchEvent(new CustomEvent('wire:loading', { 
            detail: { id: this.id, loading, target, anyLoading } 
        }));
    }

    private getCsrfToken() {
        return document.querySelector(`meta[name="${this.config.csrf || 'csrf-token'}"]`)?.getAttribute('content') || undefined;
    }
}
