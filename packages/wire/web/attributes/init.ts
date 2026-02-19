import { registerWireHandler } from "../core/directives";

registerWireHandler("init", (el, { expression }) => {
    // @ts-expect-error Alpine internal
    const component = el._x_dataStack?.find((d: any) => typeof d.call === "function");
    if (component && expression) {
        queueMicrotask(() => component.call(expression));
    }
});
