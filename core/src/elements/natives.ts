import type { Kire } from "../kire";
import { consumeStream } from "../utils/stream";

export default (kire: Kire) => {
    // 1. Kire Control Flow & Utility Elements (<kire:directive>)
    kire.element({
        name: 'kire',
        parent: ':', // Matches <kire:if>, <kire:for>, etc.
        run: async (ctx) => {
            const name = ctx.element.parent; 
            if (!name) return;

            const attrs = ctx.element.attributes;
            const kire = ctx.$kire;

            switch (name) {
                case "if": {
                    const condition = attrs.cond ?? attrs.condition ?? attrs.value;
                    if (condition) {
                        ctx.replace(ctx.element.inner);
                    } else {
                        ctx.replace(""); 
                    }
                    break;
                }
                case "unless": {
                    const condition = attrs.cond ?? attrs.condition ?? attrs.value;
                    if (!condition) {
                        ctx.replace(ctx.element.inner);
                    } else {
                        ctx.replace(""); 
                    }
                    break;
                }
                case "for":
                case "each": {
                    const items = attrs.loop || attrs.each || attrs.items || [];
                    const as = attrs.as || 'item';
                    const indexAs = attrs.index || 'index';
                    
                    let result = "";
                    if (Array.isArray(items)) {
                        for (let i = 0; i < items.length; i++) {
                            // Re-render inner content with new scope
                            // Note: This assumes the inner content wasn't already destroyed by pre-interpolation
                            const rendered = await kire.render(ctx.element.inner, { 
                                ...ctx.$props,
                                [as]: items[i],
                                [indexAs]: i
                            });
                            result += await consumeStream(rendered);
                        }
                    }
                    ctx.replace(result);
                    break;
                }
                case "switch": {
                    const value = attrs.value || attrs.on || attrs.expr;
                    // Store switch state in context for children (case/default) to find
                    // We use a symbol or internal key
                    const switchKey = Symbol.for('kire:switch');
                    (ctx as any)[switchKey] = value;
                    (ctx as any)[Symbol.for('kire:switch_matched')] = false;
                    
                    // The children will be processed in the next re-scans of processElements
                    // but we need them to be rendered now.
                    ctx.replace(ctx.element.inner);
                    break;
                }
                case "case": {
                    const switchKey = Symbol.for('kire:switch');
                    const matchedKey = Symbol.for('kire:switch_matched');
                    const switchValue = (ctx as any)[switchKey];
                    const caseValue = attrs.value ?? attrs.is;

                    if (switchValue === caseValue) {
                        (ctx as any)[matchedKey] = true;
                        ctx.replace(ctx.element.inner);
                    } else {
                        ctx.replace("");
                    }
                    break;
                }
                case "default": {
                    const matchedKey = Symbol.for('kire:switch_matched');
                    if (!(ctx as any)[matchedKey]) {
                        ctx.replace(ctx.element.inner);
                    } else {
                        ctx.replace("");
                    }
                    break;
                }
                case "define": {
                    const name = attrs.name || attrs.value;
                    if (!ctx["~defines"]) ctx["~defines"] = {};
                    ctx["~defines"][name!] = ctx.element.inner;
                    ctx.replace("");
                    break;
                }
                case "defined": {
                    const defines = ctx.$typed<Record<string, string>>("~defines") || {};
                    const id = attrs.id || attrs.name || attrs.value;
                    if (defines[id!] !== undefined) {
                        ctx.replace(defines[id!]!);
                    } else {
                        ctx.replace(ctx.element.inner);
                    }
                    break;
                }
                case "stack": {
                    const name = (attrs.name || attrs.value);
                    const stacks = ctx["~stacks"] || {};
                    const content = (stacks[name!] || []).join('\n');
                    ctx.replace(content);
                    break;
                }
                case "push": {
                    const name = attrs.name || attrs.value || attrs.to;
                    if (!ctx["~stacks"]) ctx["~stacks"] = {};
                    if (!ctx["~stacks"][name!]) ctx["~stacks"][name!] = [];
                    ctx["~stacks"][name!].push(ctx.element.inner);
                    ctx.replace("");
                    break;
                }
                case "yield": {
                    const name = attrs.name || attrs.value;
                    const slots = ctx.$props.slots || {};
                    const content = slots[name!] || attrs.default || "";
                    ctx.replace(content);
                    break;
                }
                case "csrf": {
                    //@ts-expect-error ignore
                    const token = ctx.$globals.csrf || "";
                    ctx.replace(`<input type="hidden" name="_token" value="${token}">`);
                    break;
                }
                case "method": {
                    const m = attrs.value || attrs.method || "POST";
                    ctx.replace(`<input type="hidden" name="_method" value="${m}">`);
                    break;
                }
                case "include": {
                    const path = attrs.path || attrs.view;
                    if (!path) return;
                    const response = await kire.view(path, { ...ctx.$props, ...attrs });
                    ctx.replace(await consumeStream(response));
                    break;
                }
                case "component":
                case "layout":
                case "extends": {
                    const path = attrs.path || attrs.view;
                    if (!path) return;

                    const props = { ...ctx.$props, ...attrs };
                    const slots: Record<string, string> = { default: '' };
                    const innerHtml = ctx.element.inner;
                    const slotRegex = /<x-slot:([a-zA-Z0-9-_]+)(?:[^>]*)>([\s\S]*?)<\/x-slot:\1>/gi;
                    let match;
                    let lastIndex = 0;
                    const defaultParts = [];

                    while ((match = slotRegex.exec(innerHtml)) !== null) {
                        defaultParts.push(innerHtml.slice(lastIndex, match.index));
                        slots[match[1]!] = match[2]!;
                        lastIndex = slotRegex.lastIndex;
                    }
                    defaultParts.push(innerHtml.slice(lastIndex));
                    slots.default = defaultParts.join("").trim();

                    props.slots = slots;
                    props.attributes = ctx.$att;

                    const response = await kire.view(path, props);
                    ctx.replace(await consumeStream(response));
                    break;
                }
                default:
                    // Fallback para diretivas desconhecidas: mantém o conteúdo e remove a tag
                    ctx.replace(ctx.element.inner);
                    break;
            }
        }
    });

    // 2. Generic Component System (<x-name>)
    kire.element({
        name: 'x',
        parent: '-', 
        run: async (ctx) => {
            const componentName = ctx.element.parent;
            if (!componentName || componentName.startsWith('slot')) return;

            let viewPath = componentName;
            if (kire.$namespaces.has('components')) {
                viewPath = `components.${componentName}`;
            }

            const props = { ...ctx.$props, ...ctx.element.attributes };
            const slots: Record<string, string> = { default: '' };
            const innerHtml = ctx.element.inner;
            
            const slotRegex = /<x-slot:([a-zA-Z0-9-_]+)(?:[^>]*)>([\s\S]*?)<\/x-slot:\1>/gi;
            let match;
            let lastIndex = 0;
            const defaultParts = [];

            while ((match = slotRegex.exec(innerHtml)) !== null) {
                defaultParts.push(innerHtml.slice(lastIndex, match.index));
                slots[match[1]!] = match[2]!;
                lastIndex = slotRegex.lastIndex;
            }
            defaultParts.push(innerHtml.slice(lastIndex));
            slots.default = defaultParts.join("").trim();

            props.slots = slots;
            props.attributes = ctx.$att;

            try {
                const response = await ctx.$kire.view(viewPath, props);
                ctx.replace(await consumeStream(response));
            } catch (e: any) {
                console.error(`[x-${componentName}] Error:`, e);
                ctx.replace(`<!-- Error rendering ${componentName}: ${e.message} -->`);
            }
        }
    });
};
