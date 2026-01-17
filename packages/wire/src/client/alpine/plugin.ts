import { Component } from "../core/component";
import { DOM } from "../core/dom";

export default function KireWirePlugin(Alpine: any) {
    const config = window.__KIREWIRE_CONFIG__ || { endpoint: '/_kirewire' };

    Alpine.data('kirewire', function() {
        return {
            init() {
                const el = this.$el as HTMLElement;
                if (el.hasAttribute('wire:id')) {
                    const snapshotAttr = el.getAttribute('wire:snapshot');
                    if (snapshotAttr) {
                        // Component is initialized via lifecycle.ts interceptor usually,
                        // but we need access to the instance here for $wire proxying scope sync.
                        
                        // We wait for lifecycle to attach the instance?
                        // Or we attach it here if missing?
                        
                        // Actually lifecycle.ts attaches __livewire.
                        // We use __wire in plugin. Let's unify to __livewire or __wire.
                        // Component.ts doesn't care.
                        
                        // Let's rely on lifecycle.ts for initialization.
                        // But Alpine.data init runs BEFORE or AFTER interceptInit?
                        
                        // If we use x-data, interceptInit runs for the root element.
                        
                        // Let's verify instance availability.
                        let component = (el as any).__livewire;
                        if (!component) {
                            component = new Component(el, snapshotAttr, config);
                            (el as any).__livewire = component;
                        }
                        
                        component.$data = this;

                        // Hydrate Alpine state
                        if (component.data) {
                            Object.keys(component.data).forEach(key => {
                                (this as any)[key] = component.data[key];
                                this.$watch(key, (value: any) => {
                                    component.update({ [key]: value });
                                });
                            });
                        }

                        // Register listeners (wire:on)
                        const listeners = component.snapshot.memo.listeners || {};
                        Object.keys(listeners).forEach(event => {
                            const method = listeners[event];
                            window.addEventListener(event, (e: any) => {
                                component.call(method, e.detail ? (Array.isArray(e.detail) ? e.detail : [e.detail]) : []);
                            });
                        });
                        
                        // Handle Response Hook
                        const originalHandle = (component as any).handleResponse.bind(component);
                        (component as any).handleResponse = (response: any, method: any) => {
                            originalHandle(response, method);
                            
                            // Sync state
                            if (component.data) {
                                Object.keys(component.data).forEach(k => {
                                    if ((this as any)[k] !== component.data[k]) {
                                        (this as any)[k] = component.data[k];
                                    }
                                });
                            }
                        };
                    }
                }
            }
        };
    });

    Alpine.magic('wire', (el: HTMLElement) => {
        const root = el.closest('[wire\:id]');
        if (!root) return undefined;
        
        const component = (root as any).__livewire as Component;
        if (!component) return undefined;

        return new Proxy(component, {
            get(target, prop) {
                if (typeof prop !== 'string') return undefined;
                if (target.data && prop in target.data) return target.data[prop];
                if (prop === '$refresh') return () => target.call('$refresh');
                if (prop === 'on') return (event: string, cb: Function) => window.addEventListener(event, (e: any) => cb(e.detail));
                
                return (...params: any[]) => target.call(prop, params);
            },
            set(target, prop, value) {
                if (typeof prop !== 'string') return false;
                target.update({ [prop]: value });
                return true;
            }
        });
    });
}
