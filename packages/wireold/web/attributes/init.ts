import { registerWireHandler } from "../core/directives";

registerWireHandler("init", (_el, { expression }, { component }) => {
    if (component && expression) {
        queueMicrotask(() => component.call(expression));
    }
});
