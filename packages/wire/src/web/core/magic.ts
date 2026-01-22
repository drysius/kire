import { findComponentByEl } from "./store";
import { generateEntangleFunction } from "../features/entangle";

export function registerMagic(Alpine: any) {
    Alpine.magic('wire', (el: HTMLElement) => {
        const component = findComponentByEl(el);

        if (!component) {
            console.warn('Livewire: No component found for $wire', el);
            return undefined;
        }

        return new Proxy({}, {
            get(target, prop: string) {
                if (prop === '__instance') return component;
                
                // Magics
                if (prop === '$refresh') return () => component.call('$refresh');
                if (prop === '$set') return (property: string, value: any) => component.update({ [property]: value });
                if (prop === '$dispatch') return (event: string, params: any) => window.dispatchEvent(new CustomEvent(event, { detail: params }));
                
                // Entangle
                if (prop === '$entangle' || prop === 'entangle') {
                    return generateEntangleFunction(component, Alpine);
                }
                
                // State Access
                if (prop in component.data) {
                    return component.data[prop];
                }

                // Method Call Fallback
                return (...params: any[]) => {
                    return component.call(prop, params);
                };
            },

            set(target, prop: string, value: any) {
                // If property exists in data, assume it's a direct update attempt
                // In Livewire, setting a property on $wire triggers an update
                component.update({ [prop]: value });
                return true;
            }
        });
    });
}
