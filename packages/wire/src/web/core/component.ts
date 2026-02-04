import type { ClientAdapter } from "../../adapters/http";
import type { WirePayload, WireResponse } from "../../types";
import { dispatch, listen } from "./events";
import { trigger } from "./hooks";
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
    private canonical: any = {}; // Last known server state
	private cleanupFns: Function[] = [];
	public activeRequests = new Set<string>();
	private pendingUpdates: Record<string, any> = {};

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

		// Re-register listeners if they changed (Livewire does this via effects)
		if (effects.listeners) {
			this.initListeners(effects.listeners);
		}
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
			const response: WireResponse = await this.adapter.request(fullPayload);
			this.handleResponse(response, "$refresh");
		} catch (e) {
			console.error(`[KireWire] loadLazy error for ${this.id}`, e);
		} finally {
			this.setLoading(false, "$lazy");
		}
	}

	private initListeners(listenersOverride?: Record<string, string>) {
		const listeners =
			listenersOverride || (this.snapshot ? this.snapshot.memo.listeners : {});
		if (!listeners) return;

		Object.entries(listeners).forEach(([event, method]) => {
			const cleanup = listen(this, event, (detail: any) => {
				const params = detail ?? [];
				const args = Array.isArray(params) ? params : [params];
				this.call(method as string, args);
			});

			this.cleanupFns.push(cleanup);
		});
	}

	public cleanup() {
		this.cleanupFns.forEach((fn) => fn());
		this.cleanupFns = [];
	}

	public destroy() {
		this.sendRequest({ method: "$unmount", params: [] }, undefined, {
			keepalive: true,
		}).catch(() => {
			// Ignore errors during destroy
		});
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
			onSend: [],
			onSuccess: [],
			onError: [],
			onFinish: [],
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

        // Track active upload wrappers to update their progress
        const activeUploads: any[] = [];
        const findUploads = (obj: any) => {
            if (obj && obj._is_upload_wrapper) {
                activeUploads.push(obj);
            } else if (Array.isArray(obj)) {
                obj.forEach(findUploads);
            } else if (obj && typeof obj === 'object') {
                Object.values(obj).forEach(findUploads);
            }
        };
        findUploads(updates);

		const fullPayload: WirePayload = {
			component: this.name,
			snapshot: JSON.stringify(this.snapshot),
			method: payload.method || "$refresh",
			params: payload.params || [],
			updates: Object.keys(updates).length > 0 ? updates : undefined,
			_token: this.getCsrfToken(),
		};

		// Message Interceptors
		const messageLifecycle: any = {
			onSend: [],
			onSuccess: [],
			onError: [],
			onFinish: [],
		};
		const messageCtx = {
			message: { component: this, payload: fullPayload },
			onSend: (cb: any) => messageLifecycle.onSend.push(cb),
			onSuccess: (cb: any) => messageLifecycle.onSuccess.push(cb),
			onError: (cb: any) => messageLifecycle.onError.push(cb),
			onFinish: (cb: any) => messageLifecycle.onFinish.push(cb),
		};
		runInterceptors(messageInterceptors, messageCtx);

		// Request Interceptors (simplified, assuming 1:1 for now)
		const requestLifecycle: any = {
			onSend: [],
			onSuccess: [],
			onError: [],
			onFinish: [],
		};
		const requestCtx = {
			request: { url: this.config.endpoint, payload: fullPayload },
			onSend: (cb: any) => requestLifecycle.onSend.push(cb),
			onSuccess: (cb: any) => requestLifecycle.onSuccess.push(cb),
			onError: (cb: any) => requestLifecycle.onError.push(cb),
			onFinish: (cb: any) => requestLifecycle.onFinish.push(cb),
		};
		runInterceptors(requestInterceptors, requestCtx);

		this.setLoading(true, payload.method);

		const lifecycles = [actionLifecycle, messageLifecycle, requestLifecycle];
		lifecycles.forEach((l) => l?.onSend.forEach((cb: any) => cb()));

        // Progress Handler
        const onProgress = (percent: number) => {
            activeUploads.forEach(wrapper => {
                if (wrapper.uploading) {
                    wrapper.uploading.progress = percent;
                    wrapper.uploading.percent = Math.round(percent);
                    wrapper.uploading.loaded = (wrapper.size * percent) / 100;
                }
            });
            // Dispatch a specific upload-progress event if anyone is listening (like loading-progress directive)
            window.dispatchEvent(
                new CustomEvent("wire:upload-progress", {
                    detail: { id: this.id, progress: percent },
                })
            );
        };

		try {
			const response: WireResponse = await this.adapter.request(
				fullPayload,
				requestOptions,
                onProgress
			);

			lifecycles.forEach((l) =>
				l?.onSuccess.forEach((cb: any) => cb(response)),
			);

			this.handleResponse(response, payload.method);
		} catch (e) {
			console.error(e);
			lifecycles.forEach((l) => l?.onError.forEach((cb: any) => cb(e)));
		} finally {
			lifecycles.forEach((l) => l?.onFinish.forEach((cb: any) => cb()));
			this.setLoading(false, payload.method);
		}
	}

	private handleResponse(response: WireResponse, method?: string) {
		if (!response.components) return;

		response.components.forEach((comp) => {
			const snapObj = JSON.parse(comp.snapshot);

			if (snapObj.memo.id === this.id) {
				this.snapshot = snapObj;
                this.mergeNewState(snapObj.data);
			}

			this.processEffects(comp.effects);

			if (comp.effects.redirect) window.location.href = comp.effects.redirect;

			if (comp.effects.url) {
				const currentUrl = new URL(window.location.href);
				// Merge new query params
				const newParams = new URLSearchParams(comp.effects.url);
				newParams.forEach((v, k) => currentUrl.searchParams.set(k, v));
				// Clean empty
				// history.pushState({}, '', currentUrl.toString());
				// Kirewire style: replaceState or pushState depending on config, usually push
				window.history.pushState({}, "", "?" + newParams.toString());
			}

			if (comp.effects.html) {
				this.morph(comp.effects.html, comp.snapshot);
			}

			// Dispatch update event for Entangle
			window.dispatchEvent(
				new CustomEvent(`wire:update:${this.id}`, {
					detail: this.data,
				}),
			);

			if (comp.effects.emits) {
				comp.effects.emits.forEach((e: any) => {
					// Use new dispatch helper
					dispatch(this, e.event, e.params);
				});
			}

			// Handle Streams (if present in effects)
			if ((comp.effects as any).streams) {
				(comp.effects as any).streams.forEach((stream: any) =>
					this.processStream(stream),
				);
			}
		});
	}

    private mergeNewState(newData: any) {
        for (const key in newData) {
            // Only update client state if the server actually changed this property
            // This prevents overwriting local changes that haven't been synced yet
            const serverValue = newData[key];
            const previousServerValue = this.canonical[key];

            if (JSON.stringify(serverValue) !== JSON.stringify(previousServerValue)) {
                this.data[key] = serverValue;
            }
        }
        // Update canonical state to the new server truth
        this.canonical = JSON.parse(JSON.stringify(newData));
    }

	private processStream(stream: {
		target: string;
		content: string;
		replace?: boolean;
		method?: string;
	}) {
		const targets = document.querySelectorAll(
			`[wire\\:stream="${stream.target}"]`,
		);
		targets.forEach((el) => {
			if (stream.replace) {
				el.outerHTML = stream.content;
			} else {
				const method = stream.method || "append";
				if (method === "append")
					el.insertAdjacentHTML("beforeend", stream.content);
				if (method === "prepend")
					el.insertAdjacentHTML("afterbegin", stream.content);
				if (method === "remove") el.remove();
				if (method === "update") el.innerHTML = stream.content;
			}
		});
	}

	private morph(html: string, newSnapshot: string) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		const newEl = doc.body.firstElementChild as HTMLElement;

		if (!newEl) return;
		newEl.setAttribute("wire:snapshot", newSnapshot);

		trigger("morph", { el: this.el, component: this });

		(window as any).Alpine.morph(this.el, newEl, {
			updating: (el: any, toEl: any, childrenOnly: any, skip: any) => {
				if (el === this.el) {
					(toEl as any).__kirewire = this;
				}

				trigger("morph.updating", {
					el,
					toEl,
					component: this,
					skip,
					childrenOnly,
				});

				if (el instanceof Element && el.hasAttribute("wire:ignore"))
					return skip();

				// Dialog preservation logic (keep modal open if it was open on client)
				if (
					el instanceof HTMLDialogElement &&
					toEl instanceof HTMLDialogElement
				) {
					if (el.hasAttribute("open") && !toEl.hasAttribute("open")) {
						toEl.setAttribute("open", "");
					}
				}

				// Input preservation logic
				if (
					el instanceof HTMLInputElement ||
					el instanceof HTMLTextAreaElement ||
					el instanceof HTMLSelectElement
				) {
					// If element is focused, skip update to avoid disrupting user
					if (el === document.activeElement) return skip();

					// If it has wire:model.defer, we trust client state over server state during polls/updates
					// (unless it's a specific response to a save action, but here we are general)
					if (el.hasAttribute("wire:model.defer")) return skip();

					if (toEl instanceof Element && el.hasAttribute("wire:model")) {
						// Check if value changed on server
						let newValue;
						if (
							el instanceof HTMLTextAreaElement ||
							el instanceof HTMLSelectElement
						) {
							newValue = (toEl as any).value;
						} else {
							newValue = toEl.getAttribute("value");
						}

						const currentValue = el.value;

						// If the server value is effectively the same as current value,
						// we skip DOM update to preserve cursor position / selection state.
						if (newValue === currentValue) {
							return skip();
						}

						// If values are different (e.g. server cleared the input),
						// we allow the update to proceed (no skip).
						el.value = (toEl as any).value;
						return;
					}
				}
			},
			key: (el: any) => {
				if (typeof el.hasAttribute !== "function") return;
				return el.hasAttribute(`wire:id`)
					? el.getAttribute(`wire:id`)
					: el.hasAttribute(`wire:key`)
						? el.getAttribute(`wire:key`)
						: el.id;
			},
		});

		trigger("morphed", { el: this.el, component: this });
	}

	private setLoading(loading: boolean, target?: string) {
		// Use a unique key for each request type to allow concurrency tracking
		// If target is undefined (global), we use 'global'
		// If target is '$set', we might want to differentiate *which* property?
		// For now, simple target tracking.
		const key = target || "global";

		if (loading) {
			this.activeRequests.add(key);
			this.el.setAttribute("wire:loading-state", "true");
		} else {
			this.activeRequests.delete(key);
			if (this.activeRequests.size === 0) {
				this.el.removeAttribute("wire:loading-state");
			}
		}

		const anyLoading = this.activeRequests.size > 0;

		window.dispatchEvent(
			new CustomEvent("wire:loading", {
				detail: { id: this.id, loading, target, anyLoading },
			}),
		);
	}

	private getCsrfToken() {
		return (
			document
				.querySelector(`meta[name="${this.config.csrf || "csrf-token"}"]`)
				?.getAttribute("content") || undefined
		);
	}
}