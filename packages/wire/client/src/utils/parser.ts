import { serializeEvent } from "./events";

export function parseAction(actionString: string, event?: Event): { method: string; params: any[] } {
    let method = actionString;
    let params: any[] = [];

    if (actionString.includes('(') && actionString.endsWith(')')) {
        const match = actionString.match(/^([^(]+)\((.*)\)$/);
        if (match) {
            method = match[1]!.trim();
            const argsContent = match[2];
            if (argsContent && argsContent.trim()) {
                params = parseParams(argsContent, event);
            }
        }
    }
    return { method, params };
}

function parseParams(argsContent: string, event?: Event): any[] {
    const params: any[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    const flush = () => {
        if (current.trim()) {
            params.push(parseValue(current.trim(), event));
        }
        current = '';
    };

    for (let i = 0; i < argsContent.length; i++) {
        const char = argsContent[i];
        
        if ((char === '"' || char === "'") && (i === 0 || argsContent[i - 1] !== '\\')) {
            if (inQuote && char === quoteChar) {
                inQuote = false;
            } else if (!inQuote) {
                inQuote = true;
                quoteChar = char;
            }
            current += char;
        } else if (char === ',' && !inQuote) {
            flush();
        } else {
            current += char;
        }
    }
    flush();

    return params;
}

function parseValue(val: string, event?: Event): any {
    if (val === '$event') return serializeEvent(event);
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null') return null;
    if (val === 'undefined') return undefined;
    
    if (!isNaN(Number(val)) && val !== '') return Number(val);
    
    if ((val.startsWith("'" ) && val.endsWith("'" )) || (val.startsWith('"') && val.endsWith('"'))) {
        return val.slice(1, -1);
    }
    
    return val;
}
