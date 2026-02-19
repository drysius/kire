import { registerWireHandler } from "../core/directives";

registerWireHandler("poll", (el, { modifiers, expression }, { cleanup }) => {
    let interval: Timer;
    let duration = 2000;

    const msMod = modifiers.find((m: string) => m.endsWith("ms"));
    const sMod = modifiers.find((m: string) => m.endsWith("s") && !m.endsWith("ms"));
    if (msMod) duration = parseInt(msMod);
    if (sMod) duration = parseInt(sMod) * 1000;

    const action = expression || "$refresh";
    const keepAlive = modifiers.includes("keep-alive");
    const visibleOnly = modifiers.includes("visible");

    // @ts-expect-error Alpine internal
    const component = el._x_dataStack?.[0];
    if (!component) return;

    const pollFn = () => {
        if (!document.body.contains(el)) {
            clearInterval(interval);
            return;
        }
        if (!navigator.onLine) return;
        if (document.hidden && !keepAlive) return;
        if (visibleOnly) {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        }
        if (component.__isLoading) return;

        component.call(action);
    };

    interval = setInterval(pollFn, duration);
    cleanup(() => clearInterval(interval));
});
