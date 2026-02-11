
import { transitionDomMutation } from "../directives/transition";
import type { ClientAdapter } from "../../adapters/http";
import type { WirePayload, WireResponse } from "../../types";
import { dispatch, listen } from "./events";
import { trigger } from "./hooks";
import { messageBus } from "./message-bus";
import {
	actionInterceptors,
	messageInterceptors,
	requestInterceptors,
	runInterceptors,
} from "./interceptor";

export class Component {
	public id: string;
	public name: string;
	public snapshot: any;
	public data: any;
    private canonical: any = {}; 
	private cleanupFns: Function[] = [];
    private listenerCleanups: Function[] = [];
	public activeRequests = new Map<string, number>(); 
	private pendingUpdates: Record<string, any> = {};
    private isSyncingFromServer = false;

	constructor(
		public el: HTMLElement,
		snapshot: string | null,
		public config: any,
		public adapter: ClientAdapter,
	) {
		const Alpine = (window as any).Alpine;

		if (snapshot) {
			this.snapshot = JSON.parse(snapshot);
			this.id = this.snapshot.memo.id;
			this.name = this.snapshot.memo.name;
            this.canonical = JSON.parse(JSON.stringify(this.snapshot.data));
			this.data = Alpine
				? Alpine.reactive(JSON.parse(JSON.stringify(this.snapshot.data)))
				: JSON.parse(JSON.stringify(this.snapshot.data));
		} else {
			this.id = el.getAttribute("wire:id") || "";
			this.name = el.getAttribute("wire:component") || "";
			this.data = Alpine ? Alpine.reactive({}) : {};
            this.canonical = {};
			this.snapshot = null;
		}

		trigger("component.init", { component: this });

		this.initListeners();
	}

	public processEffects(effects: any) {
		trigger("effect", {
			component: this,
			effects,
		});

		if (effects.scripts && Array.isArray(effects.scripts)) {
			effects.scripts.forEach((script: string) => {
				if ((window as any).Alpine) {
					(window as any).Alpine.evaluate(this.el, script);
				} else {
					new Function(script).call(this.data);
				}
			});
		}

        if (effects.download) {
            this.handleDownload(effects.download);
        }

		if (effects.listeners) {
			this.initListeners(effects.listeners);
		}
	}

    private handleDownload(download: any) {
        const byteCharacters = atob(download.content);
        const byteArrays = [];
        const sliceSize = 512;

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: download.contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = download.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

	public async loadLazy() {
		const paramsJson = this.el.getAttribute("wire:init-params");
		const params = paramsJson ? JSON.parse(paramsJson) : {};

		const fullPayload: any = {
			component: this.name,
			id: this.id,
			method: "$refresh",
			params: [],
			updates: params,
			_token: this.getCsrfToken(),
		};

		this.setLoading(true, "$lazy");

		try {
			const response: WireResponse = await messageBus.enqueue(this, fullPayload);
			this.handleResponse(response, "$refresh");
		} catch (e) {
			console.error(`[KireWire] loadLazy error for ${this.id}`, e);
		} finally {
			this.setLoading(false, "$lazy");
		}
	}

	private initListeners(listenersOverride?: Record<string, string>) {
        // Clear previous listeners to avoid duplication
        this.listenerCleanups.forEach(fn => fn());
        this.listenerCleanups = [];

		const listeners =
			listenersOverride || (this.snapshot ? this.snapshot.memo.listeners : {});
		if (!listeners) return;

		Object.entries(listeners).forEach(([event, method]) => {
			const cleanup = listen(this, event, (detail: any) => {
				const params = detail ?? [];
				const args = Array.isArray(params) ? params : [params];
				this.call(method as string, args);
			});

			this.listenerCleanups.push(cleanup);
		});
	}

	public cleanup() {
		this.cleanupFns.forEach((fn) => fn());
		this.cleanupFns = [];
        this.listenerCleanups.forEach((fn) => fn());
        this.listenerCleanups = [];
	}

	public destroy() {
		this.sendRequest({ method: "$unmount", params: [] }, undefined, {
			keepalive: true,
		}).catch(() => {});
	}

	public inscribeSnapshotAndEffectsOnElement() {
		if (!this.el || !this.snapshot) return;
		const snapshotString = JSON.stringify(this.snapshot)
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;");
		this.el.setAttribute("wire:snapshot", snapshotString);
	}

	async call(method: string, params: any[] = []) {
		const lifecycle: any = {
			onSend: [], onSuccess: [], onError: [], onFinish: [],
		};

		const ctx = {
			action: { component: this, name: method, params },
			onSend: (cb: any) => lifecycle.onSend.push(cb),
			onSuccess: (cb: any) => lifecycle.onSuccess.push(cb),
			onError: (cb: any) => lifecycle.onError.push(cb),
			onFinish: (cb: any) => lifecycle.onFinish.push(cb),
		};

		runInterceptors(actionInterceptors, ctx);

		return this.sendRequest({ method, params }, lifecycle);
	}

	async update(updates: Record<string, any>) {
        if (this.isSyncingFromServer) return;
		return this.sendRequest({ method: "$set", params: [], updates });
	}

	async deferUpdate(updates: Record<string, any>) {
		Object.assign(this.pendingUpdates, updates);
	}

	private async sendRequest(
		payload: Partial<WirePayload>,
		actionLifecycle?: any,
		requestOptions?: RequestInit,
	) {
		const updates = { ...this.pendingUpdates, ...payload.updates };
		this.pendingUpdates = {};

		const method = payload.method || "$refresh";
		this.setLoading(true, method);

		const lifecycles = [actionLifecycle]; // Interceptors simplified here for now
		lifecycles.forEach((l) => l?.onSend.forEach((cb: any) => cb()));

		try {
			const response: WireResponse = await messageBus.enqueue(this, {
                ...payload,
                updates: Object.keys(updates).length > 0 ? updates : undefined
            });

			lifecycles.forEach((l) => l?.onSuccess.forEach((cb: any) => cb(response)));
			this.handleResponse(response, method);
		} catch (e) {
			console.error(e);
			lifecycles.forEach((l) => l?.onError.forEach((cb: any) => cb(e)));
		} finally {
			lifecycles.forEach((l) => l?.onFinish.forEach((cb: any) => cb()));
			this.setLoading(false, method);
		}
	}

	private handleResponse(response: WireResponse, method?: string) {
		if (!response.components) return;

		response.components.forEach((comp) => {
			const snapObj = JSON.parse(comp.snapshot);

			if (snapObj.memo.id === this.id) {
                this.isSyncingFromServer = true;
                try {
				    this.snapshot = snapObj;
                    this.mergeNewState(snapObj.data);
                    
                    this.processEffects(comp.effects);

                    if (comp.effects.redirect) window.location.href = comp.effects.redirect;

                    if (comp.effects.url) {
                        const newParams = new URLSearchParams(comp.effects.url);
                        window.history.pushState({}, "", "?" + newParams.toString());
                    }

                    if (comp.effects.html) {
                        this.morph(comp.effects.html, comp.snapshot);
                    }

                    trigger("component.updated", { component: this, data: this.data });
                    window.dispatchEvent(new CustomEvent(`wire:update:${this.id}`, { detail: this.data }));

                    if (comp.effects.emits) {
                        comp.effects.emits.forEach((e: any) => dispatch(this, e.event, e.params));
                    }

                    if ((comp.effects as any).streams) {
                        (comp.effects as any).streams.forEach((stream: any) => this.processStream(stream));
                    }
                } finally {
                    this.isSyncingFromServer = false;
                }
			}
		});

        queueMicrotask(() => this.forceModelSync());
	}

    private mergeNewState(newData: any) {
        for (const key in newData) {
            const serverValue = newData[key];
            const previousServerValue = this.canonical[key];

            if (JSON.stringify(serverValue) !== JSON.stringify(previousServerValue)) {
                // Alpine proxy will catch this, but since isSyncingFromServer is true,
                // our model directive should ignore this update if we add the check there.
                this.data[key] = serverValue;
            }
        }
        this.canonical = JSON.parse(JSON.stringify(newData));
    }

    private forceModelSync() {
        this.el.querySelectorAll('input, textarea, select').forEach((el: any) => {
            if (el._x_forceModelUpdate && el._x_model) {
                try {
                    el._x_forceModelUpdate(el._x_model.get());
                } catch (e) {}
            }
        });
    }

	private processStream(stream: any) {
		const targets = document.querySelectorAll(`[wire\\:stream="${stream.target}"]`);
		targets.forEach((el: any) => {
			if (stream.replace) el.outerHTML = stream.content;
			else {
				const method = stream.method || "append";
				if (method === "append") el.insertAdjacentHTML("beforeend", stream.content);
				if (method === "prepend") el.insertAdjacentHTML("afterbegin", stream.content);
				if (method === "remove") el.remove();
				if (method === "update") el.innerHTML = stream.content;
			}
		});
	}

	private async morph(html: string, newSnapshot: string) {
        // Extract and run assets before morphing if they are in the HTML
        const cleanHtml = this.extractAndRunAssets(html);

		const parser = new DOMParser();
		const doc = parser.parseFromString(cleanHtml, "text/html");
		const newEl = doc.body.firstElementChild as HTMLElement;
		if (!newEl) return;
		newEl.setAttribute("wire:snapshot", newSnapshot);

		trigger("morph", { el: this.el, component: this });

        await transitionDomMutation(this.el, () => {
            (window as any).Alpine.morph(this.el, newEl, {
                updating: (el: any, toEl: any, childrenOnly: any, skip: any) => {
                    if (el === this.el) (toEl as any).__kirewire = this;
                    trigger("morph.updating", { el, toEl, component: this, skip, childrenOnly });
                    if (el instanceof Element && el.hasAttribute("wire:ignore")) return skip();
                    if (el instanceof HTMLDialogElement && toEl instanceof HTMLDialogElement) {
                        if (el.hasAttribute('open') && !toEl.hasAttribute('open')) toEl.setAttribute('open', '');
                    }
                    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
                        if (el === document.activeElement) return skip();
                        if (el.hasAttribute("wire:model.defer")) return skip();
                    }
                },
                key: (el: any) => {
                    if (typeof el.hasAttribute !== "function") return;
                    return el.hasAttribute(`wire:id`) ? el.getAttribute(`wire:id`) : el.hasAttribute(`wire:key`) ? el.getAttribute(`wire:key`) : el.id;
                },
            });
        });

		trigger("morphed", { el: this.el, component: this });
	}

    private extractAndRunAssets(html: string): string {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // Scripts
        div.querySelectorAll('script').forEach(script => {
            const onceKey = script.getAttribute('data-wire-once');
            if (onceKey && document.querySelector(`script[data-wire-once="${onceKey}"]`)) {
                script.remove();
                return;
            }
            const newScript = document.createElement('script');
            Array.from(script.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = script.textContent;
            document.head.appendChild(newScript);
            script.remove();
        });

        // Styles
        div.querySelectorAll('style').forEach(style => {
            document.head.appendChild(style);
            style.remove();
        });

        return div.innerHTML;
    }

	public setLoading(loading: boolean, target?: string) {
		const key = target || "global";
        let count = this.activeRequests.get(key) || 0;

		if (loading) {
            count++;
			this.activeRequests.set(key, count);
			this.el.setAttribute("wire:loading-state", "true");
		} else {
            count = Math.max(0, count - 1);
            if (count === 0) this.activeRequests.delete(key);
            else this.activeRequests.set(key, count);
            
			if (this.activeRequests.size === 0) {
				this.el.removeAttribute("wire:loading-state");
			}
		}

        trigger("loading", { component: this, loading, target, anyLoading: this.activeRequests.size > 0 });
	}

	public getCsrfToken() {
		return document.querySelector(`meta[name="${this.config.csrf || "csrf-token"}"]`)?.getAttribute("content") || undefined;
	}
}
