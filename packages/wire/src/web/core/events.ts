import { findComponentByEl, getByName } from "./store";

export function dispatch(component: any, name: string, params: any) {
    dispatchEvent(component.el, name, params);
}

export function dispatchGlobal(name: string, params: any) {
    dispatchEvent(window as any, name, params);
}

export function dispatchTo(componentName: string, name: string, params: any) {
    const components = getByName(componentName);
    components.forEach(component => {
        dispatchEvent(component.el, name, params, false);
    });
}

export function dispatchSelf(component: any, name: string, params: any) {
    dispatchEvent(component.el, name, params, false);
}

function dispatchEvent(target: HTMLElement | Window, name: string, params: any, bubbles = true) {
    // Ensure params is an array
    const detail = Array.isArray(params) ? params : [params];

    const event = new CustomEvent(name, {
        bubbles,
        detail: detail,
        composed: true
    });

    // Add KireWire metadata
    (event as any).__kirewire = {
        name,
        params: detail,
        receivedBy: []
    };

    target.dispatchEvent(event);
}

export function listen(component: any, name: string, callback: (payload: any) => void) {
    const handler = (e: any) => {
        if (!e.__kirewire) return; // Ignore non-KireWire events if we want strict mode?
        // Livewire actually allows standard events too, but for inter-component, it uses meta.
        
        if (e.__kirewire) {
             e.__kirewire.receivedBy.push(component.id);
        }

        callback(e.detail);
    };

    window.addEventListener(name, handler);

    return () => window.removeEventListener(name, handler);
}
