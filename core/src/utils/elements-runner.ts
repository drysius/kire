import type { KireContext, ElementDefinition } from "../types";
import { Attributes } from "./attributes";

export const processElements = ($ctx: KireContext): Promise<string> | string => {
    if ($ctx.$kire.$elements.size === 0) return $ctx.$response;
    
    const used = $ctx.$file.usedElements;
    if (!used || used.size === 0) return $ctx.$response;

    const elementMatchers: { 
        prefix: string; 
        def: ElementDefinition; 
        isRegex: boolean;
        hasParent: boolean;
    }[] = [];

    const patternParts: string[] = [];

    for (const def of $ctx.$kire.$elements) {
        if (def.name instanceof RegExp) {
            let isUsed = false;
            for (const tagName of used) {
                if (def.name.test(tagName)) {
                    isUsed = true;
                    break;
                }
            }
            if (isUsed) {
                elementMatchers.push({ prefix: "", def, isRegex: true, hasParent: false });
                patternParts.push(def.name.source);
            }
        } else {
            const name = def.name;
            const parent = def.parent || "";
            const prefix = parent ? `${name}${parent}` : name;
            
            let isUsed = false;
            for (const tagName of used) {
                if (tagName === prefix || (parent && tagName.startsWith(prefix))) {
                    isUsed = true;
                    break;
                }
            }

            if (isUsed) {
                elementMatchers.push({ prefix, def, isRegex: false, hasParent: !!parent });
                patternParts.push(prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
            }
        }
    }

    if (elementMatchers.length === 0) return $ctx.$response;

    elementMatchers.sort((a, b) => b.prefix.length - a.prefix.length);
    const combinedRegex = new RegExp(`^(${patternParts.join("|")})`);

    const hasAsyncRun = elementMatchers.some(m => {
        const run = m.def.run || (m.def as any).onCall;
        return run && (run.constructor.name === 'AsyncFunction' || run instanceof Promise);
    });

    if (hasAsyncRun) {
        return scanHtmlAsync($ctx.$response, $ctx, elementMatchers, combinedRegex);
    } else {
        return scanHtmlSync($ctx.$response, $ctx, elementMatchers, combinedRegex);
    }
};

function scanHtmlSync(html: string, ctx: KireContext, matchers: any[], combinedRegex: RegExp): string {
    let buffer = "";
    let i = 0;
    const len = html.length;

    while (i < len) {
        const nextTag = html.indexOf('<', i);
        if (nextTag === -1) {
            buffer += html.slice(i);
            break;
        }

        buffer += html.slice(i, nextTag);
        i = nextTag;

        if (html[i + 1] === '/' || html[i + 1] === '!') {
            buffer += '<';
            i++;
            continue;
        }

        let j = i + 1;
        while (j < len && !/\s|\/|>/.test(html[j]!)) j++;
        const tagName = html.slice(i + 1, j);

        if (!combinedRegex.test(tagName)) {
            buffer += '<';
            i++;
            continue;
        }

        let matchedDef: ElementDefinition | null = null;
        let matchedRef: any = null;

        for (const m of matchers) {
            if (m.isRegex) {
                if ((m.def.name as RegExp).test(tagName)) {
                    matchedDef = m.def;
                    matchedRef = m;
                    break;
                }
            } else {
                if (tagName === m.prefix || (m.hasParent && tagName.startsWith(m.prefix))) {
                    matchedDef = m.def;
                    matchedRef = m;
                    break;
                }
            }
        }

        if (matchedDef) {
            const attrStart = j;
            let tagEnd = attrStart;
            let inQuote = null;
            while (tagEnd < len) {
                const char = html[tagEnd];
                if (inQuote) {
                    if (char === inQuote && html[tagEnd-1] !== '') inQuote = null;
                } else {
                    if (char === '"' || char === "'") inQuote = char;
                    else if (char === '>') break;
                }
                tagEnd++;
            }
            
            const rawAttrs = html.slice(attrStart, tagEnd);
            const isSelfClosing = html[tagEnd - 1] === '/' || matchedDef.void;
            
            const attributes: Record<string, any> = {};
            parseAttributesSync(rawAttrs, attributes, ctx);

            let inner = "";
            let outerEnd = tagEnd + 1;

            if (!isSelfClosing) {
                const closeTag = `</${tagName}>`;
                let depth = 1;
                let searchPos = outerEnd;
                
                while (depth > 0 && searchPos < len) {
                    const nextOpen = html.indexOf(`<${tagName}`, searchPos);
                    const nextClose = html.indexOf(closeTag, searchPos);

                    if (nextClose === -1) break;

                    if (nextOpen !== -1 && nextOpen < nextClose) {
                        depth++;
                        searchPos = nextOpen + 1;
                    } else {
                        depth--;
                        if (depth === 0) {
                            inner = html.slice(outerEnd, nextClose);
                            outerEnd = nextClose + closeTag.length;
                        } else {
                            searchPos = nextClose + 1;
                        }
                    }
                }
            }
            
            const outer = html.slice(i, outerEnd);
            const elCtx: any = ctx.$fork();
            elCtx.$att = new Attributes(attributes);
            elCtx.element = {
                tagName,
                attributes,
                inner,
                outer,
                parent: matchedRef.hasParent ? tagName.slice(matchedRef.prefix.length) : undefined
            };

            let output = "";
            let replaced = false;

            elCtx.replace = (str: string) => {
                output = str;
                replaced = true;
            };
            elCtx.replaceElement = elCtx.replace;

            const run = matchedDef.run || (matchedDef as any).onCall;
            if (run) {
                run(elCtx);
            }

            if (replaced) {
                buffer += scanHtmlSync(output, ctx, matchers, combinedRegex);
            } else {
                buffer += outer;
            }

            i = outerEnd;
        } else {
            buffer += '<';
            i++;
        }
    }

    return buffer;
}

async function scanHtmlAsync(html: string, ctx: KireContext, matchers: any[], combinedRegex: RegExp): Promise<string> {
    let buffer = "";
    let i = 0;
    const len = html.length;

    while (i < len) {
        const nextTag = html.indexOf('<', i);
        if (nextTag === -1) {
            buffer += html.slice(i);
            break;
        }

        buffer += html.slice(i, nextTag);
        i = nextTag;

        if (html[i + 1] === '/' || html[i + 1] === '!') {
            buffer += '<';
            i++;
            continue;
        }

        let j = i + 1;
        while (j < len && !/\s|\/|>/.test(html[j]!)) j++;
        const tagName = html.slice(i + 1, j);

        if (!combinedRegex.test(tagName)) {
            buffer += '<';
            i++;
            continue;
        }

        let matchedDef: ElementDefinition | null = null;
        let matchedRef: any = null;

        for (const m of matchers) {
            if (m.isRegex) {
                if ((m.def.name as RegExp).test(tagName)) {
                    matchedDef = m.def;
                    matchedRef = m;
                    break;
                }
            } else {
                if (tagName === m.prefix || (m.hasParent && tagName.startsWith(m.prefix))) {
                    matchedDef = m.def;
                    matchedRef = m;
                    break;
                }
            }
        }

        if (matchedDef) {
            const attrStart = j;
            let tagEnd = attrStart;
            let inQuote = null;
            while (tagEnd < len) {
                const char = html[tagEnd];
                if (inQuote) {
                    if (char === inQuote && html[tagEnd-1] !== '') inQuote = null;
                } else {
                    if (char === '"' || char === "'") inQuote = char;
                    else if (char === '>') break;
                }
                tagEnd++;
            }
            
            const rawAttrs = html.slice(attrStart, tagEnd);
            const isSelfClosing = html[tagEnd - 1] === '/' || matchedDef.void;
            
            const attributes: Record<string, any> = {};
            await parseAttributesAsync(rawAttrs, attributes, ctx);

            let inner = "";
            let outerEnd = tagEnd + 1;

            if (!isSelfClosing) {
                const closeTag = `</${tagName}>`;
                let depth = 1;
                let searchPos = outerEnd;
                
                while (depth > 0 && searchPos < len) {
                    const nextOpen = html.indexOf(`<${tagName}`, searchPos);
                    const nextClose = html.indexOf(closeTag, searchPos);

                    if (nextClose === -1) break;

                    if (nextOpen !== -1 && nextOpen < nextClose) {
                        depth++;
                        searchPos = nextOpen + 1;
                    } else {
                        depth--;
                        if (depth === 0) {
                            inner = html.slice(outerEnd, nextClose);
                            outerEnd = nextClose + closeTag.length;
                        } else {
                            searchPos = nextClose + 1;
                        }
                    }
                }
            }
            
            const outer = html.slice(i, outerEnd);
            const elCtx: any = ctx.$fork();
            elCtx.$att = new Attributes(attributes);
            elCtx.element = {
                tagName,
                attributes,
                inner,
                outer,
                parent: matchedRef.hasParent ? tagName.slice(matchedRef.prefix.length) : undefined
            };

            let output = "";
            let replaced = false;

            elCtx.replace = (str: string) => {
                output = str;
                replaced = true;
            };
            elCtx.replaceElement = elCtx.replace;

            const run = matchedDef.run || (matchedDef as any).onCall;
            if (run) {
                await run(elCtx);
            }

            if (replaced) {
                buffer += await scanHtmlAsync(output, ctx, matchers, combinedRegex);
            } else {
                buffer += outer;
            }

            i = outerEnd;
        } else {
            buffer += '<';
            i++;
        }
    }

    return buffer;
}

function parseAttributesSync(raw: string, store: Record<string, any>, ctx: KireContext) {
    let cursor = 0;
    const len = raw.length;
    while (cursor < len) {
        while (cursor < len && (/\s/.test(raw[cursor]!) || raw[cursor] === '/')) cursor++;
        if (cursor >= len) break;
        const keyMatch = raw.slice(cursor).match(/^([^\s=/>]+)/);
        if (!keyMatch) { cursor++; continue; }
        const key = keyMatch[1]!; cursor += key.length;
        while (cursor < len && /\s/.test(raw[cursor]!)) cursor++;
        if (cursor < len && raw[cursor] === '=') {
            cursor++; while (cursor < len && /\s/.test(raw[cursor]!)) cursor++;
            if (cursor < len) {
                const char = raw[cursor];
                if (char === '"' || char === "'") {
                    const quote = char; cursor++;
                    const endQuote = raw.indexOf(quote, cursor);
                    if (endQuote !== -1) { store[key] = raw.slice(cursor, endQuote); cursor = endQuote + 1; }
                    else { store[key] = raw.slice(cursor); cursor = len; }
                } else {
                    const match = raw.slice(cursor).match(/^([^\s>]+)/);
                    if (match) { store[key] = match[1]; cursor += match[1]!.length; }
                }
            }
        } else { store[key] = true; }
    }
}

async function parseAttributesAsync(raw: string, store: Record<string, any>, ctx: KireContext) {
    parseAttributesSync(raw, store, ctx);
}
