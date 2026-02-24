import { Component } from "./core/component";
import { addComponent, findComponentByEl, findComponent } from "./store";
import { handlers } from "./core/directives";

/**
 * Robust Alpine integration using Lifecycle hooks.
 */
export default function WireAlpinePlugin(Alpine: any) {
    // 1. Magic $wire variable
    Alpine.magic("wire", (el: HTMLElement) => {
        return findComponentByEl(el);
    });

    // 2. Add root selector for [wire:id]
    // Two backslashes in JS results in one backslash in the CSS selector string: [wire\:id]
    Alpine.addRootSelector(() => "[wire\\:id]");

    /**
     * The heart of Wire stability: intercept every element initialization.
     */
    Alpine.interceptInit(
        Alpine.skipDuringClone((el: HTMLElement) => {
            // A. Initialize root components
            if (el.hasAttribute("wire:id")) {
                const id = el.getAttribute("wire:id")!;
                let component = findComponent(id);
                
                if (!component) {
                    component = new Component(el);
                    addComponent(id, component);
                }
                
                (el as any).__wire = component;
            }

            // B. Process wire:* attributes manually for this element
            const component = findComponentByEl(el);
            if (component) {
                attachWireToDataScopes(el, component);
                processWireAttributes(el, component, Alpine);
            }
        })
    );
}

function processWireAttributes(el: HTMLElement, component: any, Alpine: any) {
    // Only initialize an element once to prevent double binding
    if ((el as any).__wire_initialized) return;
    (el as any).__wire_initialized = true;

    const attrs = el.getAttributeNames();
    
    for (const name of attrs) {
        if (!name.startsWith("wire:")) continue;

        const parts = name.slice(5).split(".");
        const type = parts[0];
        const modifiers = parts.slice(1);
        const expression = el.getAttribute(name) || "";

        const handler = handlers.get(type);
        if (handler) {
            handler(el, { modifiers, expression }, { 
                Alpine, 
                component
            });
        }
    }
}

function attachWireToDataScopes(el: HTMLElement, component: any) {
    queueMicrotask(() => {
        const scopes = (el as any)._x_dataStack;
        if (!Array.isArray(scopes)) return;

        for (const scope of scopes) {
            if (!scope || typeof scope !== "object") continue;
            if (Object.prototype.hasOwnProperty.call(scope, "$wire")) continue;
            Object.defineProperty(scope, "$wire", {
                get: () => component,
                enumerable: false,
                configurable: true,
            });
        }
    });
}
