import type { ClientConfig, WireRequest, WireResponse } from "./types";
import { parseAction } from "./utils/parser";
import { findWireAttribute, updateDom, setLoadingState, findComponentRoot } from "./utils/dom";
import { getValueFromElement } from "./utils/value";
import { safeSelector } from "./utils/selector";

export class KireWireClient {
    private config: ClientConfig;
    private observer: MutationObserver;

    constructor(config: ClientConfig) {
        this.config = config;
        
        this.observer = new MutationObserver(() => this.initPolls());
        
        if (document.body) {
            this.init();
            this.observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
                if (document.body) {
                    this.observer.observe(document.body, { childList: true, subtree: true });
                }
            });
        }
    }

    private init() {
        const events = [
            'click', 'dblclick', 
            'submit', 
            'change', 'input', 
            'mouseenter', 'mouseleave', 
            'keydown', 'keyup', 'keypress',
            'focusin', 'focusout'
        ];

        events.forEach(type => {
            const useCapture = ['mouseenter', 'mouseleave', 'focusin', 'focusout'].includes(type);
            document.addEventListener(type, (e) => this.handleEvent(e), useCapture);
        });

        this.initPolls();
    }

    private initPolls() {
        let polls: NodeListOf<Element> | HTMLElement[] = [];
        try {
            polls = document.querySelectorAll(safeSelector('wire:poll'));
        } catch (e) {
            const all = document.querySelectorAll('*');
            const manualPolls: HTMLElement[] = [];
            for (let i = 0; i < all.length; i++) {
                if (all[i].hasAttribute('wire:poll')) {
                    manualPolls.push(all[i] as HTMLElement);
                }
            }
            polls = manualPolls;
        }

        polls.forEach(el => {
            if ((el as any).__wire_poll) return;

            const durationAttr = el.getAttribute('wire:poll');
            let duration = 2000;
            
            if (durationAttr && durationAttr.endsWith('ms')) {
                duration = parseInt(durationAttr);
            } else if (durationAttr && !isNaN(parseInt(durationAttr))) {
                 duration = parseInt(durationAttr);
            }

            const root = findComponentRoot(el as HTMLElement);
            if (!root) return;
            
            const componentId = root.getAttribute('wire:id');
            const componentName = root.getAttribute('wire:component');

            if (!componentId || !componentName) return;

            (el as any).__wire_poll = setInterval(() => {
                let currentRoot: HTMLElement | null = null;
                try {
                    currentRoot = document.querySelector(safeSelector('wire:id', componentId!));
                } catch(e) {}
                
                if (!currentRoot) {
                    clearInterval((el as any).__wire_poll);
                    delete (el as any).__wire_poll;
                    return;
                }
                const currentSnapshot = currentRoot.getAttribute('wire:snapshot');
                if (currentSnapshot) {
                    this.call(componentId!, currentSnapshot, componentName!, '$refresh', []);
                }
            }, duration);
        });
    }

    private async handleEvent(e: Event) {
        const target = e.target as HTMLElement;
        if (!target || !target.getAttributeNames) return;

        // --- 1. Handle wire:model ---
        const allAttrs = target.getAttributeNames();
        const modelAttr = allAttrs.find(a => a === 'wire:model' || a.startsWith('wire:model.'));
        
        if ((e.type === 'input' || e.type === 'change') && modelAttr) {
            const modelName = target.getAttribute(modelAttr)!;
            const modifiers = modelAttr.split('.').slice(1);
            
            if (modifiers.includes('lazy') && e.type === 'input') {
                return;
            }

            let debounce = (e.type === 'input') ? 150 : 0;
            if (modifiers.includes('debounce')) {
                const durationIndex = modifiers.indexOf('debounce') + 1;
                if (modifiers[durationIndex] && modifiers[durationIndex].endsWith('ms')) {
                    debounce = parseInt(modifiers[durationIndex]);
                }
            }

            const value = getValueFromElement(target);

            this.callDebounced(target, debounce, async (root, id, snap, name) => {
                await this.call(id, snap, name, '$set', [modelName, value]);
            });
            return;
        }

        // --- 2. Handle wire:events ---
        const result = findWireAttribute(target, e.type);
        if (!result) return;
        
        const { el, attribute, modifiers } = result;

        if (modifiers.includes('prevent') || e.type === 'submit') {
            e.preventDefault();
        }
        
        if (modifiers.includes('stop')) {
            e.stopPropagation();
        }

        const confirmMsg = el.getAttribute('wire:confirm');
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
        
        const componentId = root.getAttribute('wire:id');
        const snapshot = root.getAttribute('wire:snapshot');
        const componentName = root.getAttribute('wire:component');

        if (!componentId || !snapshot || !componentName) return;

        const debounceMod = modifiers.find(m => m.startsWith('debounce'));
        if (debounceMod) {
            const durationIndex = modifiers.indexOf(debounceMod) + 1;
            let duration = 150;
            if (modifiers[durationIndex] && modifiers[durationIndex].endsWith('ms')) {
                duration = parseInt(modifiers[durationIndex]);
            }
            this.callDebounced(el, duration, async () => {
                await this.call(componentId, snapshot, componentName, method, params);
            });
            return;
        }

        await this.call(componentId, snapshot, componentName, method, params);
    }

    private callDebounced(el: HTMLElement, duration: number, callback: (root: HTMLElement, id: string, snap: string, name: string) => Promise<void>) {
        const root = findComponentRoot(el);
        if (!root) return;
        const id = root.getAttribute('wire:id')!;
        const snap = root.getAttribute('wire:snapshot')!;
        const name = root.getAttribute('wire:component')!;

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

    public async call(id: string, snapshot: string, name: string, method: string, params: any[]) {
        try {
            if (this.config.method === 'socket') {
                console.warn('KireWire: Socket method not yet implemented in client.');
                return;
            }

            setLoadingState(id, true);

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            const payload: WireRequest = { component: name, snapshot, method, params };

            const res = await fetch(this.config.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Network error: ' + res.status);

            const data: WireResponse = await res.json();
            
            if (data.error) {
                console.error('KireWire Server Error:', data.error);
                // Future: Flash message or trigger error event specific to business logic
            }

            this.handleResponse(id, data);

        } catch (error) {
            console.error('KireWire Error:', error);
            window.dispatchEvent(new CustomEvent('kirewire:error', { detail: { error, componentId: id } }));
        } finally {
            setLoadingState(id, false);
        }
    }

    private handleResponse(id: string, data: WireResponse) {
        if (data.redirect) {
            window.location.href = data.redirect;
            return;
        }

        if (data.html) {
            updateDom(id, data.html, data.snapshot);
            this.initPolls();
        }

        if (data.events && Array.isArray(data.events)) {
            data.events.forEach(e => {
                window.dispatchEvent(new CustomEvent(e.name, { detail: e.params }));
            });
        }
    }
}