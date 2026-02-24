/**
 * Global store for client-side Wire component instances.
 */
const components = new Map<string, any>();

export function addComponent(id: string, component: any) {
    components.set(id, component);
}

export function findComponent(id: string) {
    const comp = components.get(id);
    if (comp?.el && !document.body.contains(comp.el)) {
        components.delete(id);
        return undefined;
    }
    return comp;
}

export function removeComponent(id: string) {
    components.delete(id);
}

export function allComponents() {
    for (const [id, comp] of components) {
        if (!comp?.el || !document.body.contains(comp.el)) {
            components.delete(id);
        }
    }
    return [...components.values()];
}

export function clearComponents() {
    for (const comp of components.values()) {
        if (comp && typeof comp.destroy === "function") {
            try {
                comp.destroy();
            } catch {}
        }
    }
    components.clear();
}

/**
 * Robustly finds the nearest Wire component for an element.
 */
export function findComponentByEl(el: HTMLElement): any {
    // Optimization: if it's already attached to the element
    if ((el as any).__wire) return (el as any).__wire;

    let current: HTMLElement | null = el;
    while (current) {
        if ((current as any).__wire) return (current as any).__wire;
        
        if (current.hasAttribute && current.hasAttribute("wire:id")) {
            const id = current.getAttribute("wire:id")!;
            const comp = components.get(id);
            if (comp) {
                // Cache the reference on the element
                (current as any).__wire = comp;
                return comp;
            }
        }
        current = current.parentElement;
    }
    return null;
}
