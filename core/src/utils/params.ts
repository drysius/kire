export function isPatternDefinition(def: string): boolean {
    return def.includes(" ") || def.includes("$") || def.includes("{");
}

export function parseParamDefinition(def: string): any {
    if (def.includes('|')) {
        const parts = def.split('|').map(p => parseParamDefinition(p.trim()));
        return {
            name: parts[0].name,
            validate: (val: any) => {
                for (const p of parts) {
                    const res = p.validate(val);
                    if (res.valid) return res;
                }
                return { valid: false, error: "No match for union type" };
            }
        };
    }

    if (isPatternDefinition(def)) {
        let name = "pattern";
        let pattern = def;
        const col = def.indexOf(':');
        if (col !== -1 && !def.slice(0, col).includes(' ')) {
            name = def.slice(0, col);
            pattern = def.slice(col + 1);
        }
        return {
            name,
            validate: (input: string) => {
                const extracted = matchPattern(pattern!, input);
                return extracted ? { valid: true, extracted } : { valid: false, error: `Pattern mismatch: ${pattern}` };
            }
        };
    }

    let [name, type] = def.includes(':') ? def.split(':') : [def, 'any'];
    if (name.endsWith('?')) name = name.slice(0, -1);
    
    return {
        name,
        validate: (val: any) => ({ valid: true }) 
    };
}

function matchPattern(pattern: string, input: string): Record<string, any> | null {
    if (!input || typeof input !== 'string') return null;
    const pTokens = pattern.split(/\s+/);
    const iTokens = input.trim().split(/\s+/);
    const result: Record<string, any> = {};
    
    let i = 0;
    for (const p of pTokens) {
        if (i >= iTokens.length && !p.startsWith('$...')) return null;

        if (p.startsWith('$')) {
            if (p.startsWith('$...')) {
                const varName = p.slice(4) || 'rest';
                result[varName] = iTokens.slice(i).join(' ');
                return result;
            }
            const varName = p.slice(1);
            result[varName] = iTokens[i++];
        } else if (p.startsWith('{')) {
            // Handle {name:opt1/opt2} or {opt1/opt2}
            const inner = p.slice(1, -1);
            const [name, opts] = inner.includes(':') ? inner.split(':') : ['choice', inner];
            const options = opts!.split('/');
            if (options.includes(iTokens[i]!)) {
                result[name!] = iTokens[i++];
            } else return null;
        } else {
            if (p !== iTokens[i++]) return null;
        }
    }
    return i === iTokens.length ? result : null;
}
