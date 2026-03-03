import { registerWireHandler } from "../core/directives";

registerWireHandler("poll", (el, { modifiers, expression }, { component }) => {
    let interval: Timer;
    let duration = 2000;

    const msMod = modifiers.find((m: string) => m.endsWith("ms"));
    const sMod = modifiers.find((m: string) => m.endsWith("s") && !m.endsWith("ms"));
    if (msMod) duration = parseInt(msMod);
    if (sMod) duration = parseInt(sMod) * 1000;

    const action = expression || "$refresh";
    const keepAlive = modifiers.includes("keep-alive");
    const visibleOnly = modifiers.includes("visible");

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
        let method = action;
        let params: any[] = [];
        const match = action.match(/^([^(]+)\((.*)\)$/);
        if (match) {
            method = match[1].trim();
            const argsStr = match[2].trim();
            if (argsStr) {
                params = argsStr.split(",").map((arg: string) => {
                    const val = arg.trim();
                    if (val === "true") return true;
                    if (val === "false") return false;
                    if (val === "null") return null;
                    if (!isNaN(Number(val))) return Number(val);
                    if (/^['"].*['"]$/.test(val)) return val.slice(1, -1);
                    return val;
                });
            }
        }
        component.call(method, ...params);
    };

    interval = setInterval(pollFn, duration);
});
