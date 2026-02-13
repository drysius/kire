import type { KireContext, ElementDefinition } from "../types";
import { Attributes } from "./attributes";

/**
 * Processes custom elements (components/tags) in the rendered HTML.
 * Uses a re-scanning strategy to safely handle nested elements.
 */
export const processElements = async ($ctx: KireContext) => {
	let resultHtml = $ctx.$response;

    const sortedElements = Array.from($ctx.$kire.$elements).sort((a, b) => {
        const nameA = a.name instanceof RegExp ? a.name.source : a.name;
        const nameB = b.name instanceof RegExp ? b.name.source : b.name;
        return nameB.length - nameA.length;
    });

    // Strategy: Repeatedly find the FIRST match of ANY element and process it.
    // This naturally handles outermost elements first.
    
    let modified = true;
    while (modified) {
        modified = false;
        let earliestMatch: any = null;
        let earliestDef: ElementDefinition | null = null;

        for (const def of sortedElements) {
            if (!def.run) continue;
            
            const tagNamePattern = def.name instanceof RegExp ? def.name.source : def.name;
            const parentSeparator = def.parent ? `\\${def.parent}` : ''; 

            let regexSource = '';
            if (def.parent && typeof def.name === 'string') {
                regexSource = `<(${def.name}${parentSeparator}[a-zA-Z0-9_\\-\\.]+)`;
            } else {
                regexSource = `<(${tagNamePattern})`;
            }

            const tagRegex = new RegExp(`${regexSource}([^>]*)(\\/?)>`, 'gi');
            const match = tagRegex.exec(resultHtml);

            if (match && (!earliestMatch || match.index < earliestMatch.index)) {
                earliestMatch = match;
                earliestDef = def;
            }
        }

        if (earliestMatch && earliestDef) {
            const m = earliestMatch;
            const def = earliestDef;
            const fullStartMatch = m[0];
            const tagName = m[1]!;
            const attrsRaw = m[2] || '';
            const isSelfClosing = !!m[3] || def.void || /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tagName);
            
            let inner = '';
            let outer = fullStartMatch;
            let contentEnd = m.index + fullStartMatch.length;

            if (!isSelfClosing) {
                const closingTag = `</${tagName}>`;
                let depth = 1;
                let searchIndex = contentEnd;
                
                while (depth > 0 && searchIndex < resultHtml.length) {
                    const nextOpen = resultHtml.indexOf(`<${tagName}`, searchIndex);
                    const nextClose = resultHtml.indexOf(closingTag, searchIndex);
                    
                    if (nextClose === -1) break; 

                    if (nextOpen !== -1 && nextOpen < nextClose) {
                        depth++;
                        searchIndex = nextOpen + 1;
                    } else {
                        depth--;
                        searchIndex = nextClose + closingTag.length;
                    }
                }

                if (depth === 0) {
                    const tagEnd = searchIndex;
                    inner = resultHtml.slice(contentEnd, tagEnd - closingTag.length);
                    outer = resultHtml.slice(m.index, tagEnd);
                    contentEnd = tagEnd;
                }
            }

            const attributes: Record<string, any> = {};
            await parseAttributes(attrsRaw, attributes, $ctx);

            const elCtx: any = Object.create($ctx);
            elCtx.content = resultHtml;
            elCtx.$att = new Attributes(attributes);
            elCtx.element = {
                tagName,
                attributes, 
                inner,
                outer,
                parent: def.parent && typeof def.name === 'string' ? tagName.replace(`${def.name}${def.parent}`, '') : undefined
            };

            let isReplaced = false;
            elCtx.replace = (replacement: string) => {
                const pre = resultHtml.slice(0, m.index);
                const pos = resultHtml.slice(contentEnd);
                resultHtml = pre + replacement + pos;
                elCtx.content = resultHtml;
                isReplaced = true;
                modified = true;
            };

            elCtx.replaceElement = elCtx.replace;

            elCtx.replaceContent = (replacement: string) => {
                const openTagEnd = outer.indexOf('>') + 1; 
                const openTag = outer.slice(0, openTagEnd);
                const closeTag = `</${tagName}>`;
                elCtx.replace(`${openTag}${replacement}${closeTag}`);
            };

			//@ts-expect-error ignore
            await (def.run ?? def.onCall)(elCtx);
            
            // If the handler didn't call replace, we should mark this tag as "processed" 
            // to avoid infinite loop. We can do this by temporary renaming or just 
            // skipping this match in next pass.
            // Actually, if it's NOT replaced, we MUST NOT find it again.
            // One way is to track processed indices, but that's hard with mutations.
            // Better: handlers SHOULD replace their elements.
            
            if (!isReplaced) {
                // To avoid infinite loop if handler doesn't call replace, 
                // we'll just stop processing for this definition in this pass or something?
                // Actually, let's just assume handlers ARE well-behaved for now.
                // But a safer way: replace with itself but marked? No.
                // Let's just break the while loop if nothing happened.
                break; 
            }
        }
    }

	return resultHtml;
};

async function parseAttributes(raw: string, store: Record<string, any>, ctx: KireContext) {
    let cursor = 0;
    const len = raw.length;

    while (cursor < len) {
        while (cursor < len && /\s/.test(raw[cursor]!)) cursor++;
        if (cursor >= len) break;

        if (raw.startsWith('{...', cursor)) {
            const end = findBalancedBrace(raw, cursor);
            if (end !== -1) {
                const expr = raw.slice(cursor + 4, end).trim(); 
                try {
                    const val = await evaluate(expr, ctx);
                    if (val && typeof val === 'object') {
                        Object.assign(store, val);
                    }
                } catch (e) {
                    console.error(`Error evaluating spread attribute: ${expr}`, e);
                }
                cursor = end + 1;
                continue;
            }
        }

        const keyMatch = raw.slice(cursor).match(/^([^\s=/>]+)/);
        if (!keyMatch) {
            cursor++;
            continue;
        }
        
        const key = keyMatch[1]!;
        cursor += key.length;

        while (cursor < len && /\s/.test(raw[cursor]!)) cursor++;

        if (cursor < len && raw[cursor] === '=') {
            cursor++; 
            while (cursor < len && /\s/.test(raw[cursor]!)) cursor++;
            
            if (cursor < len) {
                const char = raw[cursor];
                if (char === '"' || char === "'") {
                    const quote = char;
                    cursor++;
                    const endQuote = raw.indexOf(quote, cursor);
                    if (endQuote !== -1) {
                        store[key] = raw.slice(cursor, endQuote);
                        cursor = endQuote + 1;
                    } else {
                        store[key] = raw.slice(cursor);
                        cursor = len;
                    }
                } else if (char === '{') {
                    const end = findBalancedBrace(raw, cursor);
                    if (end !== -1) {
                        const expr = raw.slice(cursor + 1, end);
                        try {
                            store[key] = await evaluate(expr, ctx);
                        } catch (e) {
                            console.error(`Error evaluating attribute ${key}={${expr}}`, e);
                        }
                        cursor = end + 1;
                    } else {
                        cursor++;
                    }
                } else {
                    const match = raw.slice(cursor).match(/^([^\s>]+)/);
                    if (match) {
                        store[key] = match[1];
                        cursor += match[1]!.length;
                    }
                }
            }
        } else {
            store[key] = true;
        }
    }
}

function findBalancedBrace(str: string, start: number): number {
    let depth = 0;
    for (let i = start; i < str.length; i++) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

async function evaluate(expr: string, ctx: KireContext): Promise<any> {
    const globals = typeof (ctx.$globals as any).toObject === 'function' 
        ? (ctx.$globals as any).toObject() 
        : ctx.$globals;

    const scope = {
        ...globals,
        ...ctx.$props,
        it: ctx.$props,
        $ctx: ctx,
    };
    
    if (ctx.$kire && ctx.$kire.$executor) {
        const params = Object.keys(scope);
        const args = Object.values(scope);
        const fn = ctx.$kire.$executor(`return (${expr});`, params);
        return await fn(...args);
    }
    
    return undefined;
}
