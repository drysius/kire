import type { KireContext } from "../types";
import { Attributes } from "./attributes";
import { ATTR_SCANNER_REGEX, NullProtoObj } from "./regex";

const AsyncFunction = (async () => {}).constructor;

export const processElements = ($ctx: KireContext): Promise<string> | string => {
    const kire = $ctx.$kire;
    const regex = kire.$elementRegex;
    const matchers = kire.$elementMatchers;
    
    if (!regex || matchers.length === 0) return $ctx.$response;

    const isAsync = matchers.some(m => {
        const run = m.def.run as any;
        return run instanceof AsyncFunction || run?.[Symbol.toStringTag] === 'AsyncFunction';
    });

    return isAsync 
        ? scanAsync($ctx.$response, $ctx, matchers, regex) 
        : scanSync($ctx.$response, $ctx, matchers, regex);
};

function parseAttrs(raw: string): Record<string, any> {
    const attributes: Record<string, any> = new NullProtoObj();
    const regex = new RegExp(ATTR_SCANNER_REGEX.source, 'g');
    let m;
    while ((m = regex.exec(raw))) {
        attributes[m[1]!] = m[2] ?? m[3] ?? m[4] ?? true;
    }
    return attributes;
}

function findMatcher(tagName: string, matchers: any[]) {
    for (const m of matchers) {
        if (m.prefix && (tagName === m.prefix || tagName.startsWith(m.prefix))) return m;
        if (m.def.name instanceof RegExp && m.def.name.test(tagName)) return m;
    }
    return null;
}

async function scanAsync(html: string, ctx: KireContext, matchers: any[], regex: RegExp): Promise<string> {
    const r = new RegExp(regex.source, 'g');
    let match;
    let result = "";
    let lastIndex = 0;

    while ((match = r.exec(html))) {
        result += html.slice(lastIndex, match.index);
        // match: [0:outer, 1:selfTag, 2:selfAttr, 3:pairTag, 4:pairAttr, 5:pairInner]
        const [outer, selfTag, selfAttr, pairTag, pairAttr, pairInner] = match;
        const tagName = selfTag || pairTag;
        const attrRaw = selfAttr || pairAttr || "";
        const innerRaw = pairInner || "";

        const matcher = findMatcher(tagName!, matchers);

        if (matcher) {
            const def = matcher.def;
            // Recursively process inner content first to handle nesting
            const processedInner = innerRaw ? await scanAsync(innerRaw, ctx, matchers, regex) : "";
            
            const attributes = parseAttrs(attrRaw);
            const elCtx: any = ctx.$fork();
            elCtx.$att = new Attributes(attributes);

            let parentPart: string | undefined = undefined;
            if (matcher.prefix && tagName!.startsWith(matcher.prefix)) {
                parentPart = tagName!.slice(matcher.prefix.length);
            } else if (typeof def.name === 'string' && tagName!.startsWith(def.name)) {
                parentPart = tagName!.slice(def.name.length);
                if (def.parent && parentPart.startsWith(def.parent)) {
                    parentPart = parentPart.slice(def.parent.length);
                }
            }

            elCtx.element = { 
                tagName: tagName!, 
                attributes, 
                inner: processedInner, 
                outer,
                parent: parentPart 
            };
            
            let output = outer;
            elCtx.replace = (str: string) => { output = str; };

            if (def.run) {
                const res = def.run(elCtx);
                if (res instanceof Promise) await res;
            }
            result += output;
        } else {
            result += outer;
        }
        lastIndex = r.lastIndex;
    }
    
    return result + html.slice(lastIndex);
}

function scanSync(html: string, ctx: KireContext, matchers: any[], regex: RegExp): string {
    const r = new RegExp(regex.source, 'g');
    let match;
    let result = "";
    let lastIndex = 0;

    while ((match = r.exec(html))) {
        result += html.slice(lastIndex, match.index);
        // match: [0:outer, 1:selfTag, 2:selfAttr, 3:pairTag, 4:pairAttr, 5:pairInner]
        const [outer, selfTag, selfAttr, pairTag, pairAttr, pairInner] = match;
        const tagName = selfTag || pairTag;
        const attrRaw = selfAttr || pairAttr || "";
        const innerRaw = pairInner || "";

        const matcher = findMatcher(tagName!, matchers);

        if (matcher) {
            const def = matcher.def;
            const processedInner = innerRaw ? scanSync(innerRaw, ctx, matchers, regex) : "";
            
            const attributes = parseAttrs(attrRaw);
            const elCtx: any = ctx.$fork();
            elCtx.$att = new Attributes(attributes);

            let parentPart: string | undefined = undefined;
            if (matcher.prefix && tagName!.startsWith(matcher.prefix)) {
                parentPart = tagName!.slice(matcher.prefix.length);
            } else if (typeof def.name === 'string' && tagName!.startsWith(def.name)) {
                parentPart = tagName!.slice(def.name.length);
                if (def.parent && parentPart.startsWith(def.parent)) {
                    parentPart = parentPart.slice(def.parent.length);
                }
            }

            elCtx.element = { 
                tagName: tagName!, 
                attributes, 
                inner: processedInner, 
                outer,
                parent: parentPart 
            };
            
            let output = outer;
            elCtx.replace = (str: string) => { output = str; };

            if (def.run) def.run(elCtx);
            result += output;
        } else {
            result += outer;
        }
        lastIndex = r.lastIndex;
    }
    
    return result + html.slice(lastIndex);
}
