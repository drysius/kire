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
    public shared: {
        connected: boolean;
        channel: string;
        chunks: Array<string | ArrayBuffer | Uint8Array | any>;
        last: any;
        connections: number;
        password?: string;
        transport: string;
    };
    
    private canonicalState: any;
    private __meta: { activeRequests: number };
    public __pendingUpdates: Record<string, any> = {};
    public __deferredUpdates: Record<string, any> = {};
    private __sharedCleanup: (() => void) | null = null;
    private __sharedTarget: string | null = null;
    private __sharedWatchTimer: any = null;
    private __sharedManagedKeys: Set<string> = new Set();
    
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
                // Broadcast-managed keys are authoritative on server room state.
                // Do not send implicit state diffs for them on method calls.
                if (this.__sharedManagedKeys.has(key)) continue;
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
        this.shared = Alpine.reactive({
            connected: false,
            channel: "",
            chunks: [],
            last: null,
            connections: 0,
            password: undefined,
            transport: String((window as any).__WIRE_CONFIG__?.transport || "sse")
        });
        this._initListeners(this._readListenersFromEl());
        window.addEventListener("beforeunload", () => this.disconnectShared(), { once: true });
        queueMicrotask(() => this._autoConnectSharedFromRoot());

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

            this._applyResponse(result, { method, updates, options });
        } catch (e) {
            console.error(`[Wire] Action "${method}" failed:`, e);
        } finally {
            this.__meta.activeRequests--;
        }
    }

    _applyResponse(
        result: any,
        context: {
            method?: string;
            updates?: Record<string, any>;
            options?: { onlyKeys?: string[]; includeStateDiff?: boolean; includeDeferred?: boolean };
        } = {}
    ) {
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
            const serverState = JSON.parse(JSON.stringify(result.state));
            const mergedState = { ...serverState };
            const sentKeys = new Set(Object.keys(context.updates || {}));
            const shouldPreserveDeferred = context.options?.includeDeferred === false || context.method === "$refresh";

            // Keep unsent deferred values in local UI state after live updates (e.g. file upload).
            // Canonical state remains server-authoritative for checksum integrity.
            if (shouldPreserveDeferred) {
                for (const key of Object.keys(this.__deferredUpdates)) {
                    if (!sentKeys.has(key) && key in this.state) {
                        mergedState[key] = this.state[key];
                    }
                }
            }

            this.canonicalState = serverState;
            for (const key of Object.keys(this.state)) {
                if (!(key in mergedState)) delete this.state[key];
            }
            Object.assign(this.state, mergedState);
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

    connectShared(target: string | { channel?: string; component?: string; id?: string; password?: string } = "global") {
        const opts = typeof target === "string" ? { channel: target } : target || {};
        const channel = String(opts.channel || "global");
        const component = String(opts.component || this.name);
        const id = String(opts.id || this.id);
        const password = opts.password ?? this.shared.password;
        const key = `${component}:${id}:${channel}`;

        if (this.__sharedTarget === key && this.__sharedCleanup) return;
        this.disconnectShared();

        const connect = (window as any).Wire?.events?.connect;
        if (typeof connect !== "function") {
            if ((window as any).__WIRE_CONFIG__?.debug) {
                console.debug("[Wire] broadcast adapter not found");
            }
            return;
        }

        this.shared.channel = channel;
        this.shared.connected = false;
        this.shared.password = password;

        const close = connect({ component, id, channel, password }, (msg: any) => this._handleSharedMessage(msg));
        if (typeof close === "function") {
            this.__sharedTarget = key;
            this.__sharedCleanup = () => {
                try {
                    close();
                } catch {}
                this.__sharedTarget = null;
                this.__sharedCleanup = null;
                this.shared.connected = false;
            };

            if (this.__sharedWatchTimer) clearInterval(this.__sharedWatchTimer);
            this.__sharedWatchTimer = setInterval(() => {
                if (!this._isComponentStillMounted()) {
                    this.disconnectShared();
                }
            }, 2000);
        }
    }

    disconnectShared() {
        if (this.__sharedCleanup) {
            this.__sharedCleanup();
        }
        if (this.__sharedWatchTimer) {
            clearInterval(this.__sharedWatchTimer);
            this.__sharedWatchTimer = null;
        }
        this.shared.connected = false;
    }

    setSharedPassword(password?: string) {
        this.shared.password = typeof password === "string" && password.length > 0 ? password : undefined;
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
            const current = this._findCurrentRootEl();
            if (current) {
                this.el = current;
                (current as any).__wire = this;
                (current as any).__wire_initialized = true;
            }
            queueMicrotask(() => this._autoConnectSharedFromRoot());
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

    private _autoConnectSharedFromRoot() {
        const channel = this.el.getAttribute("wire:broadcast") || this.el.getAttribute("wire:shared");
        if (channel && channel.trim().length > 0) {
            this.connectShared(channel.trim());
        }
    }

    private _handleSharedMessage(msg: any) {
        const type = String(msg?.type || "message");
        if ((window as any).__WIRE_CONFIG__?.debug) {
            console.debug("[Wire] shared message", { id: this.id, type, msg });
        }

        if (type === "wire:broadcast:connected") {
            this.shared.connected = true;
            if (typeof msg?.connections === "number") this.shared.connections = msg.connections;
            if (typeof msg?.channel === "string") this.shared.channel = msg.channel;
            this._pushSharedChunk(`[${type}] ${JSON.stringify(msg)}`);
            return;
        }

        if (type === "wire:broadcast:snapshot" || type === "wire:broadcast:update") {
            this.shared.connected = true;
            if (typeof msg?.connections === "number") this.shared.connections = msg.connections;
            if (typeof msg?.channel === "string") this.shared.channel = msg.channel;
            const data = msg?.data && typeof msg.data === "object" ? msg.data : {};
            this.shared.last = data;
            this._applySharedState(data);
            this._pushSharedChunk(`[${type}] ${JSON.stringify(data)}`);
            return;
        }

        if (type !== "ping") {
            this._pushSharedChunk(`[event] ${JSON.stringify(msg)}`);
        }
    }

    private _applySharedState(data: Record<string, any>) {
        for (const [key, value] of Object.entries(data || {})) {
            this.__sharedManagedKeys.add(key);
            this.state[key] = value;
        }
    }

    private _pushSharedChunk(line: string) {
        this.shared.chunks.unshift(line);
        if (this.shared.chunks.length > 100) {
            this.shared.chunks.length = 100;
        }
    }

    private _isComponentStillMounted() {
        if (this.el && document.body.contains(this.el)) return true;
        const found = this._findCurrentRootEl();
        if (found) {
            this.el = found;
            (found as any).__wire = this;
            (found as any).__wire_initialized = true;
            return true;
        }
        return false;
    }

    private _findCurrentRootEl(): HTMLElement | null {
        const nodes = document.querySelectorAll("[wire\\:id]");
        for (const node of nodes) {
            if ((node as HTMLElement).getAttribute("wire:id") === this.id) {
                return node as HTMLElement;
            }
        }
        return null;
    }
}
