import type { KireContext, ElementDefinition } from "../types";
import { Attributes } from "./attributes";

export const processElements = ($ctx: KireContext): Promise<string> | string => {
    const used = $ctx.$file.usedElements;
    if (!used || used.size === 0 || $ctx.$kire.$elements.size === 0) return $ctx.$response;

    const matchers = Array.from($ctx.$kire.$elements).filter(def => {
        if (def.name instanceof RegExp) return Array.from(used).some(u => (def.name as RegExp).test(u));
        const prefix = def.parent ? `${def.name}${def.parent}` : def.name as string;
        return Array.from(used).some(u => u === prefix || (def.parent && u.startsWith(prefix)));
    });

    if (matchers.length === 0) return $ctx.$response;

    const isAsync = matchers.some(m => (m.run as any)?.constructor.name === 'AsyncFunction');
    return isAsync ? scanAsync($ctx.$response, $ctx, matchers) : scanSync($ctx.$response, $ctx, matchers);
};

function scanSync(html: string, ctx: KireContext, matchers: ElementDefinition[]): string {
    return html.replace(/<([a-zA-Z0-9_\-:]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_\-:]+)([^>]*)\/>/g, (outer, tag1, attr1, inner, tag2, attr2) => {
        const tagName = tag1 || tag2;
        const rawAttrs = attr1 || attr2 || "";
        const isSelfClosing = !!tag2;
        
        const def = matchers.find(m => m.name instanceof RegExp ? m.name.test(tagName) : (m.parent ? tagName.startsWith(m.name + m.parent) : m.name === tagName));
        if (!def) return outer;

        const attributes: Record<string, any> = {};
        if (rawAttrs) {
            const attrRegex = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
            let m;
            while ((m = attrRegex.exec(rawAttrs))) {
                attributes[m[1]!] = m[2] ?? m[3] ?? m[4] ?? true;
            }
        }

        const elCtx: any = ctx.$fork();
        elCtx.$att = new Attributes(attributes);
        elCtx.element = { tagName, attributes, inner: inner || "", outer };
        
        let output = outer;
        elCtx.replace = (str: string) => { output = str; };
        
        if (def.run) def.run(elCtx);
        return output === outer ? outer : scanSync(output, ctx, matchers);
    });
}

async function scanAsync(html: string, ctx: KireContext, matchers: ElementDefinition[]): Promise<string> {
    // Versão simplificada do scanner assíncrono usando a mesma lógica de substituição
    const regex = /<([a-zA-Z0-9_\-:]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_\-:]+)([^>]*)\/>/g;
    let match;
    let lastIndex = 0;
    let result = "";

    while ((match = regex.exec(html))) {
        result += html.slice(lastIndex, match.index);
        const [outer, tag1, attr1, inner, tag2, attr2] = match;
        const tagName = tag1 || tag2;
        const def = matchers.find(m => m.name instanceof RegExp ? m.name.test(tagName!) : (m.parent ? tagName!.startsWith(m.name + m.parent) : m.name === tagName));

        if (def) {
            const attributes: Record<string, any> = {};
            const attrRegex = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
            let am;
            while ((am = attrRegex.exec(attr1 || attr2 || ""))) attributes[am[1]!] = am[2] ?? am[3] ?? am[4] ?? true;

            const elCtx: any = ctx.$fork();
            elCtx.$att = new Attributes(attributes);
            elCtx.element = { tagName: tagName!, attributes, inner: inner || "", outer };
            let output = outer;
            elCtx.replace = (str: string) => { output = str; };

            if (def.run) await def.run(elCtx);
            result += output === outer ? outer : await scanAsync(output, ctx, matchers);
        } else {
            result += outer;
        }
        lastIndex = regex.lastIndex;
    }
    return result + html.slice(lastIndex);
}
