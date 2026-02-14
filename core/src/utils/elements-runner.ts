import type { KireContext, ElementDefinition } from "../types";
import { Attributes } from "./attributes";
import { ELEMENT_SCANNER_REGEX, ATTR_SCANNER_REGEX } from "./regex";

export const processElements = ($ctx: KireContext): Promise<string> | string => {
    const allElements = Array.from($ctx.$kire.$elements);
    if (allElements.length === 0) return $ctx.$response;

    const isAsync = allElements.some(m => {
        const run = m.run as any;
        return run?.constructor?.name === 'AsyncFunction' || run?.[Symbol.toStringTag] === 'AsyncFunction';
    });
    return isAsync ? scanAsync($ctx.$response, $ctx, allElements) : scanSync($ctx.$response, $ctx, allElements);
};

function parseAttrs(raw: string): Record<string, any> {
    const attributes: Record<string, any> = {};
    const regex = new RegExp(ATTR_SCANNER_REGEX.source, 'g');
    let m;
    while ((m = regex.exec(raw))) {
        attributes[m[1]!] = m[2] ?? m[3] ?? m[4] ?? true;
    }
    return attributes;
}

function scanSync(html: string, ctx: KireContext, matchers: ElementDefinition[]): string {
    const regex = new RegExp(ELEMENT_SCANNER_REGEX.source, 'g');
    let match;
    let result = "";
    let lastIndex = 0;
    let changed = false;

    while ((match = regex.exec(html))) {
        result += html.slice(lastIndex, match.index);
        const [outer, selfTag, selfAttr, pairTag, pairAttr, pairInner] = match;
        const tagName = selfTag || pairTag;
        const attrRaw = selfAttr || pairAttr || "";
        const innerRaw = pairInner || "";
        
        const def = matchers.find(m => {
            if (m.name instanceof RegExp) return m.name.test(tagName!);
            const prefix = m.parent ? `${m.name}${m.parent}` : m.name as string;
            return tagName === prefix || (m.parent && tagName!.startsWith(prefix));
        });

        if (def) {
            // Process inner content FIRST to handle nesting
            const processedInner = innerRaw ? scanSync(innerRaw, ctx, matchers) : "";
            
            const attributes = parseAttrs(attrRaw);
            const elCtx: any = ctx.$fork();
            elCtx.$att = new Attributes(attributes);
            
            let parentPart: string | undefined = undefined;
            if (def.parent && typeof def.name === 'string' && tagName!.startsWith(def.name + def.parent)) {
                parentPart = tagName!.slice(def.name.length + def.parent.length);
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
            if (output !== outer) {
                changed = true;
                result += output;
            } else {
                // If not replaced, but inner was processed, we need to rebuild the tag
                if (processedInner !== innerRaw) {
                    if (selfTag) {
                         // Should not happen as self-closing has no inner, but for safety:
                         result += outer;
                    } else {
                        const tagStart = outer.slice(0, outer.indexOf('>') + 1);
                        const tagEnd = outer.slice(outer.lastIndexOf('<'));
                        result += `${tagStart}${processedInner}${tagEnd}`;
                        changed = true;
                    }
                } else {
                    result += outer;
                }
            }
        } else {
            result += outer;
        }
        lastIndex = regex.lastIndex;
    }
    
    const finalHtml = result + html.slice(lastIndex);
    return changed ? scanSync(finalHtml, ctx, matchers) : finalHtml;
}

async function scanAsync(html: string, ctx: KireContext, matchers: ElementDefinition[]): Promise<string> {
    const regex = new RegExp(ELEMENT_SCANNER_REGEX.source, 'g');
    let match;
    let result = "";
    let lastIndex = 0;
    let changed = false;

    while ((match = regex.exec(html))) {
        result += html.slice(lastIndex, match.index);
        const [outer, selfTag, selfAttr, pairTag, pairAttr, pairInner] = match;
        const tagName = selfTag || pairTag;
        const attrRaw = selfAttr || pairAttr || "";
        const innerRaw = pairInner || "";

        const def = matchers.find(m => {
            if (m.name instanceof RegExp) return m.name.test(tagName!);
            const prefix = m.parent ? `${m.name}${m.parent}` : m.name as string;
            return tagName === prefix || (m.parent && tagName!.startsWith(prefix));
        });

        if (def) {
            const processedInner = innerRaw ? await scanAsync(innerRaw, ctx, matchers) : "";
            
            const attributes = parseAttrs(attrRaw);
            const elCtx: any = ctx.$fork();
            elCtx.$att = new Attributes(attributes);

            let parentPart: string | undefined = undefined;
            if (def.parent && typeof def.name === 'string' && tagName!.startsWith(def.name + def.parent)) {
                parentPart = tagName!.slice(def.name.length + def.parent.length);
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

            if (def.run) await def.run(elCtx);
            if (output !== outer) {
                changed = true;
                result += output;
            } else {
                if (processedInner !== innerRaw) {
                    if (selfTag) {
                        result += outer;
                    } else {
                        const tagStart = outer.slice(0, outer.indexOf('>') + 1);
                        const tagEnd = outer.slice(outer.lastIndexOf('<'));
                        result += `${tagStart}${processedInner}${tagEnd}`;
                        changed = true;
                    }
                } else {
                    result += outer;
                }
            }
        } else {
            result += outer;
        }
        lastIndex = regex.lastIndex;
    }
    
    const finalHtml = result + html.slice(lastIndex);
    return changed ? await scanAsync(finalHtml, ctx, matchers) : finalHtml;
}
