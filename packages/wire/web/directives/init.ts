import { Kirewire } from "../kirewire";

Kirewire.directive('init', ({ el, expression, wire }) => {
    const componentId = el.closest('[wire-id]')?.getAttribute('wire-id');
    if (componentId && expression) {
        // Run after current tick to ensure all bindings are ready
        queueMicrotask(() => {
            wire.$emit('component:call', { id: componentId, method: expression, params: [] });
        });
    }
});
