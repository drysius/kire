import type { Component } from "./component";

let components = new Map<string, Component>();

export function addComponent(component: Component) {
    components.set(component.id, component);
}

export function findComponent(id: string) {
    return components.get(id);
}

export function findComponentByEl(el: HTMLElement): Component | undefined {
    let root = el.closest('[wire\\:id]');
    if (!root) return undefined;
    
    let id = root.getAttribute('wire:id');
    return id ? components.get(id) : undefined;
}

export function removeComponent(id: string) {
    components.delete(id);
}

export function allComponents() {
    return Array.from(components.values());
}
