import { transitionDomMutation } from "../directives/transition";
import type { WirePayload, WireResponse } from "../../types";
import { dispatch, listen } from "./events";
import { trigger } from "./hooks";
import { messageBus } from "./message-bus";

/**
 * Client-side Component instance.
 * Manages reactive state, DOM morphing, event listening and server polling.
 */
export class Component {
	public id: string;
	public name: string;
	public snapshot: any;
	public data: any;
    private canonical: any = {}; 
	private cleanupFns: Array<() => void> = [];
    private listenerCleanups: Array<() => void> = [];
	public activeRequests = new Map<string, number>(); 
	private pendingUpdates: Record<string, any> = {};
    private isSyncingFromServer = false;
    private pollInterval: any;

	constructor(
		public el: HTMLElement,
		snapshotStr: string | null,
		public config: any
	) {
		const Alpine = (window as any).Alpine;

		if (snapshotStr) {
			this.snapshot = JSON.parse(snapshotStr);
            // Flexible reading for legacy or flat snapshots
			this.id = this.snapshot.memo?.id || this.snapshot.id || el.getAttribute("wire:id");
			this.name = this.snapshot.memo?.name || this.snapshot.name || el.getAttribute("wire:component");
            
            const rawData = this.snapshot.data || {};
            this.canonical = JSON.parse(JSON.stringify(rawData));
			this.data = Alpine ? Alpine.reactive(JSON.parse(JSON.stringify(rawData))) : JSON.parse(JSON.stringify(rawData));
		} else {
			this.id = el.getAttribute("wire:id") || "";
			this.name = el.getAttribute("wire:component") || "";
			this.data = Alpine ? Alpine.reactive({}) : {};
            this.canonical = {};
			this.snapshot = null;
		}

		trigger("component.init", { component: this });
		this.initListeners();
        this.startSyncPolling();
	}

    /**
     * Periodically check server for pending events (every 5s).
     * This ensures multi-component communication works over plain HTTP.
     */
    private startSyncPolling() {
        if (this.pollInterval || this.config.adapter === 'socket' || this.config.adapter === 'sse') return;
        
        this.pollInterval = setInterval(async () => {
            // Only poll if component is in DOM, not currently busy, and tab is visible
            if (!document.body.contains(this.el) || this.activeRequests.size > 0 || document.hidden) return;
            
            try {
                const res = await fetch(`${this.config.endpoint}/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: this.id })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.emits && Array.isArray(data.emits)) {
                        data.emits.forEach((e: any) => dispatch(this, e.event, e.params));
                    }
                }
            } catch (e) {
                // Silently ignore polling errors (network down, etc.)
            }
        }, 5000);
    }

	public processEffects(effects: any) {
        if (!effects) return;
		if (effects.download) this.handleDownload(effects.download);
		if (effects.listeners) this.initListeners(effects.listeners);
        if (effects.emits) effects.emits.forEach((e: any) => dispatch(this, e.event, e.params));
        
        // Custom scripts
		if (effects.scripts && Array.isArray(effects.scripts)) {
			effects.scripts.forEach((script: string) => {
				if ((window as any).Alpine) (window as any).Alpine.evaluate(this.el, script);
				else new Function(script).call(this.data);
			});
		}
	}

    private handleDownload(download: any) {
        const blob = new Blob([atob(download.content)], { type: download.contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = download.name || 'download';
        link.click();
        window.URL.revokeObjectURL(url);
    }

	private initListeners(listenersOverride?: Record<string, string>) {
        this.listenerCleanups.forEach(fn => fn());
        this.listenerCleanups = [];

		const listeners = listenersOverride || this.snapshot?.memo?.listeners || {};
		Object.entries(listeners).forEach(([event, method]) => {
			const cleanup = listen(this, event, (detail: any) => {
				this.call(method as string, Array.isArray(detail) ? detail : [detail]);
			});
			this.listenerCleanups.push(cleanup);
		});
	}

	public cleanup() {
		this.cleanupFns.forEach(fn => fn());
        this.listenerCleanups.forEach(fn => fn());
        if (this.pollInterval) clearInterval(this.pollInterval);
	}

	public destroy() {
		this.sendRequest({ method: "$unmount", params: [] }).catch(() => {});
	}

	async call(method: string, params: any[] = []) {
		return this.sendRequest({ method, params });
	}

	async update(updates: Record<string, any>) {
        if (this.isSyncingFromServer) return;
		return this.sendRequest({ method: "$set", params: [], updates });
	}

	async deferUpdate(updates: Record<string, any>) {
		Object.assign(this.pendingUpdates, updates);
	}

	private async sendRequest(payload: Partial<WirePayload>) {
		const updates = { ...this.pendingUpdates, ...payload.updates };
		this.pendingUpdates = {};

		const method = payload.method || "$refresh";
		this.setLoading(true, method);

		try {
			const response: WireResponse = await messageBus.enqueue(this, {
                ...payload,
                updates: Object.keys(updates).length > 0 ? updates : undefined
            });
			this.handleResponse(response);
		} catch (e) {
			console.error("[Wire] Request failed:", e);
		} finally {
			this.setLoading(false, method);
		}
	}

	private handleResponse(response: WireResponse) {
		if (!response || !response.components) return;

		response.components.forEach((comp) => {
			const snapObj = JSON.parse(comp.snapshot);
            const compId = snapObj.memo?.id || snapObj.id;

			if (compId === this.id) {
                this.isSyncingFromServer = true;
                try {
				    this.snapshot = snapObj;
                    this.mergeNewState(snapObj.data);
                    
                    this.processEffects(comp.effects);

                    if (comp.effects.redirect) window.location.href = comp.effects.redirect;
                    
                    if (comp.effects.url) {
                        const current = new URL(window.location.href);
                        current.search = comp.effects.url;
                        window.history.pushState({}, "", current.toString());
                    }

                    if (comp.effects.html) this.morph(comp.effects.html, comp.snapshot);

                    window.dispatchEvent(new CustomEvent(`wire:update:${this.id}`, { detail: this.data }));
                    
                    if (comp.effects.streams) {
                        comp.effects.streams.forEach((stream: any) => this.processStream(stream));
                    }
                } finally {
                    this.isSyncingFromServer = false;
                }
			}
		});
        
        // Force Alpine to re-sync model bindings if needed
        queueMicrotask(() => {
            this.el.querySelectorAll('input, textarea, select').forEach((el: any) => {
                if (el._x_forceModelUpdate && el._x_model) el._x_forceModelUpdate(el._x_model.get());
            });
        });
	}

    private mergeNewState(newData: any) {
        if (!newData) return;
        for (const key in newData) {
            if (JSON.stringify(newData[key]) !== JSON.stringify(this.canonical[key])) {
                this.data[key] = newData[key];
            }
        }
        this.canonical = JSON.parse(JSON.stringify(newData));
    }

	private processStream(stream: any) {
		const targets = document.querySelectorAll(`[wire\\:stream="${stream.target}"]`);
		targets.forEach((el: any) => {
			if (stream.replace) el.outerHTML = stream.content;
			else {
				const method = stream.method || "append";
				if (method === "append") el.insertAdjacentHTML("beforeend", stream.content);
				else if (method === "prepend") el.insertAdjacentHTML("afterbegin", stream.content);
				else if (method === "remove") el.remove();
				else if (method === "update") el.innerHTML = stream.content;
			}
		});
	}

	private async morph(html: string, newSnapshot: string) {
        // Strip potential fragment markers before morphing
        const cleanHtml = html.replace(/<!--\[if FRAGMENT:.*?\]><!\[endif\]-->/g, '')
                              .replace(/<!--\[if ENDFRAGMENT:.*?\]><!\[endif\]-->/g, '');

		const parser = new DOMParser();
		const doc = parser.parseFromString(cleanHtml, "text/html");
		const newEl = doc.body.firstElementChild as HTMLElement;
		if (!newEl) return;
		newEl.setAttribute("wire:snapshot", newSnapshot);

        await transitionDomMutation(this.el, () => {
            (window as any).Alpine.morph(this.el, newEl, {
                updating: (el: any, toEl: any, childrenOnly: any, skip: any) => {
                    if (el === this.el) (toEl as any).__kirewire = this;
                    if (el instanceof Element && el.hasAttribute("wire:ignore")) return skip();
                    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                        if (el === document.activeElement) return skip();
                    }
                },
                key: (el: any) => el.getAttribute?.(`wire:id`) || el.getAttribute?.(`wire:key`) || el.id,
            });
        });
	}

	public setLoading(loading: boolean, target?: string) {
		const key = target || "global";
        let count = this.activeRequests.get(key) || 0;

		if (loading) {
			this.activeRequests.set(key, ++count);
			this.el.setAttribute("wire:loading-state", "true");
		} else {
            count = Math.max(0, --count);
            if (count === 0) this.activeRequests.delete(key);
            else this.activeRequests.set(key, count);
			if (this.activeRequests.size === 0) this.el.removeAttribute("wire:loading-state");
		}
        trigger("loading", { component: this, loading, target, anyLoading: this.activeRequests.size > 0 });
	}

	public getCsrfToken() {
		return document.querySelector(`meta[name="${this.config.csrf || "csrf-token"}"]`)?.getAttribute("content") || undefined;
	}
}
