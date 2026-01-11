import type { ClientConfig, WireRequest, WireResponse } from "./types";
import {
	findComponentRoot,
	findWireAttribute,
	setLoadingState,
	updateDom,
} from "./utils/dom";
import { parseAction } from "./utils/parser";
import { safeSelector } from "./utils/selector";
import { getValueFromElement } from "./utils/value";

export class KireWireClient {
	private config: ClientConfig;
	private observer: MutationObserver;
    private componentListeners: Map<string, Record<string, string>> = new Map();
    private activeGlobalListeners: Set<string> = new Set();

	constructor(config: ClientConfig) {
		this.config = config;

		// Inject default styles
		if (typeof document !== "undefined") {
			const style = document.createElement("style");
			style.innerHTML = `
                [wire\\:loading], [wire\\:loading\\.delay], [wire\\:offline] { display: none; }
            `;
			document.head.appendChild(style);
		}

		this.observer = new MutationObserver(() => {
            this.initPolls();
            this.initComponents();
        });

		if (document.body) {
			this.init();
			this.observer.observe(document.body, { childList: true, subtree: true });
		} else {
			document.addEventListener("DOMContentLoaded", () => {
				this.init();
				if (document.body) {
					this.observer.observe(document.body, {
						childList: true,
						subtree: true,
					});
				}
			});
		}
	}

	private init() {
		const events = [
			"click",
			"dblclick",
			"submit",
			"change",
			"input",
			"mouseenter",
			"mouseleave",
			"keydown",
			"keyup",
			"keypress",
			"focusin",
			"focusout",
		];

		events.forEach((type) => {
			const useCapture = [
				"mouseenter",
				"mouseleave",
				"focusin",
				"focusout",
			].includes(type);
			document.addEventListener(type, (e) => this.handleEvent(e), useCapture);
		});

        // wire:navigate interceptor
        document.addEventListener("click", (e) => this.handleNavigate(e));

		// Offline support
		window.addEventListener("offline", () => this.toggleOffline(true));
		window.addEventListener("online", () => this.toggleOffline(false));

		this.initPolls();
        this.initComponents();
	}

    private handleNavigate(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const anchor = target.closest("a");
        if (!anchor || !anchor.hasAttribute("wire:navigate")) return;

        e.preventDefault();
        const url = anchor.getAttribute("href");
        if (url) {
            // Emits an event so the app can handle SPA navigation
            window.dispatchEvent(new CustomEvent("kirewire:navigate", { detail: { url } }));
            // Fallback/Default: Just go there
            window.location.href = url;
        }
    }

    private initComponents() {
        const roots = document.querySelectorAll(safeSelector("wire:id"));
        roots.forEach((root) => {
            if ((root as any).__wire_inited) return;
            (root as any).__wire_inited = true;

            const initAction = root.getAttribute("wire:init");
            if (initAction) {
                const { method, params } = parseAction(initAction);
                const id = root.getAttribute("wire:id")!;
                const snap = root.getAttribute("wire:snapshot")!;
                const name = root.getAttribute("wire:component")!;
                this.call(id, snap, name, method, params);
            }

            // Register Listeners from Snapshot
            const snapAttr = root.getAttribute("wire:snapshot");
            if (snapAttr) {
                try {
                    const snap = JSON.parse(snapAttr);
                    if (snap.memo && snap.memo.listeners) {
                        const compId = root.getAttribute("wire:id")!;
                        this.componentListeners.set(compId, snap.memo.listeners);
                        Object.keys(snap.memo.listeners).forEach((event) =>
                            this.registerGlobalListener(event),
                        );
                    }
                } catch (e) {
                    console.error("[KireWire] Snapshot parse error:", e);
                }
            }
        });
    }

	private toggleOffline(isOffline: boolean) {
		const elements = document.querySelectorAll(safeSelector("wire:offline"));
		elements.forEach((el) => {
			(el as HTMLElement).style.display = isOffline ? "inline-block" : "none"; // Or remove property to assume css default
			if (!isOffline) (el as HTMLElement).style.removeProperty("display");
		});
	}

	private initPolls() {
		let polls: NodeListOf<Element> | HTMLElement[] = [];
		try {
			polls = document.querySelectorAll(safeSelector("wire:poll"));
		} catch (_e) {
			const all = document.querySelectorAll("*");
			const manualPolls: HTMLElement[] = [];
			for (let i = 0; i < all.length; i++) {
				if (all[i].hasAttribute("wire:poll")) {
					manualPolls.push(all[i] as HTMLElement);
				}
			}
			polls = manualPolls;
		}

		polls.forEach((el) => {
			if ((el as any).__wire_poll) return;

			const durationAttr = el.getAttribute("wire:poll");
			let duration = 2000;

			if (durationAttr?.endsWith("ms")) {
				duration = parseInt(durationAttr, 10);
			} else if (durationAttr && !Number.isNaN(parseInt(durationAttr, 10))) {
				duration = parseInt(durationAttr, 10);
			}

			const root = findComponentRoot(el as HTMLElement);
			if (!root) return;

			const componentId = root.getAttribute("wire:id");
			const componentName = root.getAttribute("wire:component");

			if (!componentId || !componentName) return;

			(el as any).__wire_poll = setInterval(() => {
				let currentRoot: HTMLElement | null = null;
				try {
					currentRoot = document.querySelector(
						safeSelector("wire:id", componentId!),
					);
				} catch (_e) {}

				if (!currentRoot) {
					clearInterval((el as any).__wire_poll);
					delete (el as any).__wire_poll;
					return;
				}
				const currentSnapshot = currentRoot.getAttribute("wire:snapshot");
				if (currentSnapshot) {
					this.call(
						componentId!,
						currentSnapshot,
						componentName!,
						"$refresh",
						[],
					);
				}
			}, duration);
		});
	}

	private async handleEvent(e: Event) {
		const target = e.target as HTMLElement;
		if (!target || !target.getAttributeNames) return;

		// --- 1. Handle wire:model ---
		const allAttrs = target.getAttributeNames();
		const modelAttr = allAttrs.find(
			(a) => a === "wire:model" || a.startsWith("wire:model."),
		);

		if ((e.type === "input" || e.type === "change") && modelAttr) {
			const modelName = target.getAttribute(modelAttr)!;
			const modifiers = modelAttr.split(".").slice(1);

			// Ignore deferred updates completely (they are sent with actions)
			if (modifiers.includes("defer")) {
				return;
			}

			if (modifiers.includes("lazy") && e.type === "input") {
				return;
			}

			let debounce = e.type === "input" ? 150 : 0;
			if (modifiers.includes("debounce")) {
				const durationIndex = modifiers.indexOf("debounce") + 1;
				if (modifiers[durationIndex]?.endsWith("ms")) {
					debounce = parseInt(modifiers[durationIndex], 10);
				}
			}

			const value = getValueFromElement(target);

			this.callDebounced(target, debounce, async (_root, id, snap, name) => {
				await this.call(id, snap, name, "$set", [modelName, value]);
			});
			return;
		}

		// --- 2. Handle wire:events ---
		const result = findWireAttribute(target, e.type);
		if (!result) return;

		const { el, attribute, modifiers } = result;

		if (modifiers.includes("prevent") || e.type === "submit") {
			e.preventDefault();
		}

		if (modifiers.includes("stop")) {
			e.stopPropagation();
		}

		const confirmMsg = el.getAttribute("wire:confirm");
		if (confirmMsg) {
			if (!confirm(confirmMsg)) {
				e.stopImmediatePropagation();
				e.preventDefault();
				return;
			}
		}

		const root = findComponentRoot(el);
		if (!root) {
			console.warn(`KireWire: ${attribute} used outside of a wire component.`);
			return;
		}

		const action = el.getAttribute(attribute);
		if (!action) return;

		const { method, params } = parseAction(action, e);

		const componentId = root.getAttribute("wire:id");
		const snapshot = root.getAttribute("wire:snapshot");
		const componentName = root.getAttribute("wire:component");

		if (!componentId || !snapshot || !componentName) return;

		const debounceMod = modifiers.find((m) => m.startsWith("debounce"));
		if (debounceMod) {
			const durationIndex = modifiers.indexOf(debounceMod) + 1;
			let duration = 150;
			if (modifiers[durationIndex]?.endsWith("ms")) {
				duration = parseInt(modifiers[durationIndex], 10);
			}
			this.callDebounced(el, duration, async () => {
				await this.call(componentId, snapshot, componentName, method, params);
			});
			return;
		}

		await this.call(componentId, snapshot, componentName, method, params);
	}

	private callDebounced(
		el: HTMLElement,
		duration: number,
		callback: (
			root: HTMLElement,
			id: string,
			snap: string,
			name: string,
		) => Promise<void>,
	) {
		const root = findComponentRoot(el);
		if (!root) return;
		const id = root.getAttribute("wire:id")!;
		const snap = root.getAttribute("wire:snapshot")!;
		const name = root.getAttribute("wire:component")!;

		const timerKey = `__wire_debounce_${name}`;
		const existingTimer = (el as any)[timerKey];
		if (existingTimer) clearTimeout(existingTimer);

		if (duration === 0) {
			callback(root, id, snap, name);
			return;
		}

		(el as any)[timerKey] = setTimeout(() => {
			callback(root, id, snap, name);
			delete (el as any)[timerKey];
		}, duration);
	}

	public async call(
		id: string,
		snapshot: string,
		name: string,
		method: string,
		params: any[],
	) {
		try {
			if (this.config.method === "socket") {
				console.warn("KireWire: Socket method not yet implemented in client.");
				return;
			}

			setLoadingState(id, true, method);

			// Collect deferred/current state from DOM
			const updates: Record<string, any> = {};
			const root = document.querySelector(safeSelector("wire:id", id));
			if (root) {
				// Find all elements with wire:model inside this component
				// Note: This is a simplified selector, ideally we should scope to ignore nested components
				const models = root.querySelectorAll(
					"[wire\\:model], [wire\\:model\\.defer], [wire\\:model\\.lazy], [wire\\:model\\.debounce], [wire\\:defer]",
				);

				models.forEach((el) => {
					// Ensure element belongs to this component (not a nested one)
					if (findComponentRoot(el as HTMLElement) !== root) return;

					let attrName = el
						.getAttributeNames()
						.find((a) => a.startsWith("wire:model"));
					if (!attrName) {
						attrName = el.getAttributeNames().find((a) => a === "wire:defer");
					}

					if (attrName) {
						const modelName = el.getAttribute(attrName);
						if (modelName) {
							updates[modelName] = getValueFromElement(el as HTMLElement);
						}
					}
				});
			}

			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				Accept: "application/json",
			};

			const csrfToken = document
				.querySelector('meta[name="csrf-token"]')
				?.getAttribute("content");
			if (csrfToken) {
				headers["X-CSRF-TOKEN"] = csrfToken;
			}

			const payload: WireRequest = {
				component: name,
				snapshot,
				method,
				params,
				updates: Object.keys(updates).length > 0 ? updates : undefined,
                _token: csrfToken || undefined,
			};

			const res = await fetch(this.config.endpoint, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error(`Network error: ${res.status}`);

			const data: WireResponse = await res.json();

			if (data.error) {
				console.error("KireWire Server Error:", data.error);
				// Future: Flash message or trigger error event specific to business logic
			}

			this.handleResponse(id, data);
		} catch (error) {
			console.error("KireWire Error:", error);
			window.dispatchEvent(
				new CustomEvent("kirewire:error", {
					detail: { error, componentId: id },
				}),
			);
		} finally {
			setLoadingState(id, false, method);
		}
	}

	private handleResponse(originalId: string, data: WireResponse) {
        if (data.components) {
            data.components.forEach((comp) => {
                try {
                    const snapObj = JSON.parse(comp.snapshot);
                    const compId = snapObj.memo.id || originalId;
                    const effects = comp.effects;

                    if (effects.redirect) {
                        window.location.href = effects.redirect;
                        return;
                    }

                    if (effects.html) {
                        updateDom(compId, effects.html, comp.snapshot);
                        this.initPolls();
                    }

                    if (effects.emits && Array.isArray(effects.emits)) {
                        effects.emits.forEach((e) => {
                            window.dispatchEvent(
                                new CustomEvent(e.event, { detail: e.params }),
                            );
                        });
                    }

                    if (effects.listeners) {
                        this.componentListeners.set(compId, effects.listeners);
                        Object.keys(effects.listeners).forEach((event) =>
                            this.registerGlobalListener(event),
                        );
                    }
                } catch (e) {
                    console.error("Error processing component response", e);
                }
            });
        } else if (data.error) {
             console.error("KireWire Server Error:", data.error);
        }
	}

    private registerGlobalListener(event: string) {
        if (this.activeGlobalListeners.has(event)) return;
        this.activeGlobalListeners.add(event);

        window.addEventListener(event, (e: any) => {
            this.componentListeners.forEach((listeners, compId) => {
                if (listeners[event]) {
                    const method = listeners[event];
                    const params = e.detail ?? [];

                    const root = document.querySelector(
                        safeSelector("wire:id", compId),
                    );
                    if (root) {
                        const snapshot = root.getAttribute("wire:snapshot")!;
                        const name = root.getAttribute("wire:component")!;
                        const args = Array.isArray(params) ? params : [params];
                        this.call(compId, snapshot, name, method, args);
                    }
                }
            });
        });
    }
}
