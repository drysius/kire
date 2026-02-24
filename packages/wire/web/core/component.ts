import Alpine from "alpinejs";
import { messageBus } from "./message-bus";
import { allComponents } from "../store";

/**
 * Robust Client-side Wire Component.
 */
export class Component {
    public id: string;
    public name: string;
    public state: any;
    public checksum: string;
    public el: HTMLElement;
    public listeners: Record<string, string> = {};
    
    private canonicalState: any;
    private __meta: { activeRequests: number };
    public __pendingUpdates: Record<string, any> = {};
    public __deferredUpdates: Record<string, any> = {};
    
    public deferUpdate(property: string, value: any) {
        this.__deferredUpdates[property] = value;
    }

    private _collectUpdates(options: { onlyKeys?: string[]; includeStateDiff?: boolean; includeDeferred?: boolean } = {}): Record<string, any> {
        const updates: Record<string, any> = {};
        const only = options.onlyKeys ? new Set(options.onlyKeys) : null;
        const includeDeferred = options.includeDeferred === true;

        if (only) {
            for (const key of only) {
                if (key in this.state) updates[key] = this.state[key];
            }
        } else {
            Object.assign(updates, this.__pendingUpdates);
            if (includeDeferred) Object.assign(updates, this.__deferredUpdates);
        }

        if (options.includeStateDiff !== false) {
            for (const key in this.state) {
                if (only && !only.has(key)) continue;
                if (!includeDeferred && key in this.__deferredUpdates) continue;
                if (JSON.stringify(this.state[key]) !== JSON.stringify(this.canonicalState[key])) {
                    updates[key] = this.state[key];
                }
            }
        }

        if (only) {
            for (const key of only) delete this.__pendingUpdates[key];
        } else {
            this.__pendingUpdates = {};
            if (includeDeferred) this.__deferredUpdates = {};
        }

        return updates;
    }

    constructor(el: HTMLElement) {
        this.el = el;
        this.id = el.getAttribute("wire:id")!;
        this.name = el.getAttribute("wire:component")!;
        this.checksum = el.getAttribute("wire:checksum") || "";
        
        const initialState = JSON.parse(el.getAttribute("wire:state") || "{}");
        this.canonicalState = JSON.parse(JSON.stringify(initialState));
        this.state = Alpine.reactive(initialState);
        this.__meta = Alpine.reactive({ activeRequests: 0 });
        this._initListeners(this._readListenersFromEl());

        return new Proxy(this, {
            get: (target, prop: string) => {
                if (prop in target) return (target as any)[prop];
                if (typeof prop === "string" && prop in target.state) return target.state[prop];
                if (typeof prop === "string") {
                    return (...args: any[]) => target.call(prop, ...args);
                }
                return undefined;
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

    get __isLoading() { return this.__meta.activeRequests > 0; }

    async call(method: string, ...params: any[]) {
        const isRefresh = method === "$refresh";
        return this._call(method, params, {
            includeStateDiff: true,
            includeDeferred: !isRefresh
        });
    }

    async callLive(property: string) {
        return this._call("$refresh", [], {
            onlyKeys: [property],
            includeStateDiff: false,
            includeDeferred: false
        });
    }

    private async _call(
        method: string,
        params: any[],
        options: { onlyKeys?: string[]; includeStateDiff?: boolean; includeDeferred?: boolean } = {}
    ) {
        this.__meta.activeRequests++;

        const updates = this._collectUpdates(options);

        try {
            const payload: any = {
                id: this.id,
                component: this.name,
                method,
                state: this.canonicalState,
                checksum: this.checksum
            };
            if (params.length > 0) payload.params = params;
            if (Object.keys(updates).length > 0) payload.updates = updates;

            if ((window as any).__WIRE_CONFIG__?.debug) {
                console.debug("[Wire] call()", { id: this.id, component: this.name, payload });
            }

            const result = await messageBus.enqueue(this.id, payload);

            this._applyResponse(result);
        } catch (e) {
            console.error(`[Wire] Action "${method}" failed:`, e);
        } finally {
            this.__meta.activeRequests--;
        }
    }

    _applyResponse(result: any) {
        if (!result) return;
        const effects = result.effects || {};
        if ((window as any).__WIRE_CONFIG__?.debug) {
            console.debug("[Wire] response", { id: this.id, component: this.name, result });
        }

        if (effects.redirect) {
            window.location.href = effects.redirect;
            return;
        }

        if (result.state) {
            this.canonicalState = JSON.parse(JSON.stringify(result.state));
            Object.assign(this.state, result.state);
        }
        
        if (result.checksum) this.checksum = result.checksum;
        if (effects.listeners) this._initListeners(effects.listeners);

        if (effects.events) {
            effects.events.forEach((e: any) => {
                const params = Array.isArray(e.params) ? e.params : [];
                if ((window as any).__WIRE_CONFIG__?.debug) {
                    console.debug("[Wire] dispatch event", { source: this.id, event: e.name, params });
                }

                // Direct wire-to-wire dispatch without relying on DOM listeners.
                for (const target of allComponents()) {
                    const listeners = target?.listeners && Object.keys(target.listeners).length > 0
                        ? target.listeners
                        : this._readListenersFromElement(target?.el);
                    const method = listeners?.[e.name];
                    if (method && typeof target.call === "function") {
                        if ((window as any).__WIRE_CONFIG__?.debug) {
                            console.debug("[Wire] listener match", {
                                event: e.name,
                                targetId: target.id,
                                targetComponent: target.name,
                                method
                            });
                        }
                        target.call(method, ...params);
                    }
                }

                // Keep browser event for external integrations (e.g. @notify.window).
                window.dispatchEvent(new CustomEvent(e.name, { detail: params }));
            });
        }

        if (result.html) {
            this.morph(result.html);
        }

        if (effects.streams) {
            effects.streams.forEach((s: any) => this._handleStream(s));
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
                    if (el.hasAttribute && el.hasAttribute("wire:stream")) return skip();
                    if (el.hasAttribute && (el.hasAttribute("wire:ignore") || el.hasAttribute("wire:ignore-self"))) return skip();
                    if (el === document.activeElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return skip();
                }
            });
        }
    }

    private _readListenersFromEl(): Record<string, string> {
        return this._readListenersFromElement(this.el);
    }

    private _readListenersFromElement(element?: HTMLElement | null): Record<string, string> {
        const raw = element?.getAttribute("wire:listeners");
        if (!raw) return {};
        try {
            const decoded = raw.replace(/&quot;/g, '"');
            return JSON.parse(decoded);
        } catch {
            return {};
        }
    }

    private _initListeners(listeners: Record<string, string> = {}) {
        this.listeners = listeners || {};
    }
}
