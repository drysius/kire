import { registerWireHandler } from "../core/directives";

registerWireHandler("click", (el, { modifiers, expression }, { component }) => {
    const handler = async (event: MouseEvent) => {
        if (modifiers.includes("prevent")) event.preventDefault();
        if (modifiers.includes("stop")) event.stopPropagation();
        if (modifiers.includes("self") && event.target !== el) return;

        let method = expression;
        let params: any[] = [];

        const match = expression.match(/^([^(]+)\((.*)\)$/);
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

        await component.call(method, ...params);
    };

    el.addEventListener("click", handler);
});
