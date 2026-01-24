import type { Component } from "./component";

let components = new Map<string, Component>();

export function addComponent(component: Component) {
    components.set(component.id, component);
}

export function findComponent(id: string) {
    return components.get(id);
}

export function findComponentByEl(el: HTMLElement): Component | undefined {
    // Optimization: check if element itself is a component root with instance attached
    if ((el as any).__kirewire) return (el as any).__kirewire;

    // Walk up manually checking for __kirewire or wire:id
    let current: HTMLElement | null = el;
    while (current) {
        if ((current as any).__kirewire) return (current as any).__kirewire;
        
        if (current.hasAttribute && current.hasAttribute('wire:id')) {
             const id = current.getAttribute('wire:id');
             if (id) {
                 const comp = components.get(id);
                 if (comp) return comp;
             }
        }
        
        current = current.parentElement;
    }
    
    return undefined;
}

export function removeComponent(id: string) {
    components.delete(id);
}

export function allComponents() {
    return Array.from(components.values());
}

export function first() {
    return components.values().next().value;
}

export function getByName(name: string) {
    return Array.from(components.values()).filter(c => c.name === name);
}
