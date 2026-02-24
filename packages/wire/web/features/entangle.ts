import { findComponentByEl } from "../store";

export function setupEntangle(Alpine: any) {
    Alpine.magic("entangle", (el: HTMLElement) => (property: string, defer = false) => {
        const component = findComponentByEl(el);
        if (!component) return;

        return Alpine.interceptor((initialValue: any, getter: Function, setter: Function) => {
            // 1. Sync from Wire -> Alpine
            // We watch the reactive component state
            const release = Alpine.effect(() => {
                const wireValue = component.state[property];
                // Only update if different to avoid loop
                if (JSON.stringify(wireValue) !== JSON.stringify(getter())) {
                    setter(wireValue);
                }
            });

            // 2. Sync from Alpine -> Wire
            // We assume the variable is reactive in Alpine, so we use effect again?
            // Actually, interceptor handles the "set" part when the user updates the alpine variable.
            // But interceptor is for x-model primarily. For generic usage, we might need a watcher.
            
            // If used with x-entangle="wireProp", we want changes to the alpine scope to update wire.
            // Since this is a magic, it returns a proxy/object that Alpine binds to.
            
            // Best approach for $entangle: Return an object with get/set or rely on Alpine's x-model binding.
            // But $entangle is often used inside x-data="{ local: $entangle('wire') }".
            
            // We return the initial value but hook into the setter via a watcher on the local scope?
            // No, the interceptor signature allows us to hook into get/set of the *host* property.
            
            // Setup watcher for local changes
            Alpine.effect(() => {
                const localValue = getter();
                if (JSON.stringify(localValue) !== JSON.stringify(component.state[property])) {
                    component.state[property] = localValue;
                    if (!defer) {
                        // Debounce if needed, or rely on wire:model logic
                        component.call("$refresh");
                    }
                }
            });

            return () => {
                release();
            };
        });
    });
}
