import { Kirewire } from "../kirewire";

Kirewire.directive('init', ({ el, expression, wire }) => {
    if (expression) {
        // Run after current tick to ensure all bindings are ready
        queueMicrotask(() => {
            wire.call(el, expression);
        });
    }
});
