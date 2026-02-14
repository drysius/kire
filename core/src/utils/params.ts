/**
 * Simplified parameter parser with enhanced pattern matching
 */

export interface ParamDefinition {
    name: string;
    rawDefinition: string;
    validate: (value: any) => ValidationResult;
}

export interface ValidationResult {
    valid: boolean;
    extracted?: Record<string, any>;
    error?: string;
}

type TypeChecker = (value: any) => boolean;

/**
 * Basic type validators
 */
const TYPE_VALIDATORS: Record<string, TypeChecker> = {
    string: (value) => typeof value === "string",
    number: (value) => typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value),
    boolean: (value) => typeof value === "boolean",
    any: () => true,
    object: (value) => (typeof value === "object" && value !== null && !Array.isArray(value)) || typeof value === "string",
    array: (value) => Array.isArray(value) || typeof value === "string",
    null: (value) => value === null,
    undefined: (value) => value === undefined,
    function: (value) => typeof value === "function",
    filepath: (value) => typeof value === "string",
};

export const validators = {
    register(type: string, validator: TypeChecker) {
        TYPE_VALIDATORS[type] = validator;
    },
    list() {
        return Object.keys(TYPE_VALIDATORS);
    },
};

/**
 * pre-compiled regexes for tokenization
 */
const TOKEN_REGEX = /\$([a-zA-Z0-9_]+)|\$\.\.\.([a-zA-Z0-9_]*)|{([a-zA-Z0-9_:]*\/[a-zA-Z0-9_\/:]*)}|(\S+)/g;

/**
 * matches a simple pattern like "$var {op:in/of} $rest"
 * against a string input "item in items"
 */
function matchPattern(pattern: string, input: string): Record<string, any> | null {
    if (!input || typeof input !== 'string') return null;
    
    const tokens: any[] = [];
    let match: RegExpExecArray | null;
    TOKEN_REGEX.lastIndex = 0;
    
    while ((match = TOKEN_REGEX.exec(pattern)) !== null) {
        if (match[1]) tokens.push({ type: 'var', name: match[1] });
        else if (match[2]) tokens.push({ type: 'rest', name: match[2] || 'rest' });
        else if (match[3]) {
            const inner = match[3];
            const [name, opts] = inner.includes(':') ? inner.split(':') : [null, inner];
            const options = (opts || name)!.split('/');
            tokens.push({ type: 'choice', name: name || 'choice', options });
        } else if (match[4]) tokens.push({ type: 'text', value: match[4] });
    }

    const result: Record<string, any> = {};
    let cursor = 0;
    const len = input.length;
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        while (cursor < len && /\s/.test(input[cursor]!)) cursor++;
        if (cursor >= len && token.type !== 'rest') return null;
        
        if (token.type === 'text') {
            if (!input.startsWith(token.value, cursor)) return null;
            cursor += token.value.length;
        } else if (token.type === 'choice') {
            let matched = false;
            for (const opt of token.options) {
                if (input.startsWith(opt, cursor)) {
                    const end = cursor + opt.length;
                    if (end === len || /\s/.test(input[end]!)) {
                        result[token.name] = opt;
                        cursor = end;
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) return null;
        } else if (token.type === 'var') {
            const nextToken = tokens[i + 1];
            let value = "";
            
            if (!nextToken) {
                value = input.slice(cursor);
                cursor = len;
            } else if (nextToken.type === 'text') {
                const idx = input.indexOf(nextToken.value, cursor);
                if (idx === -1) return null;
                value = input.slice(cursor, idx);
                cursor = idx;
            } else if (nextToken.type === 'choice') {
                let bestIdx = -1;
                for (const opt of nextToken.options) {
                    const idx = input.indexOf(opt, cursor);
                    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
                         bestIdx = idx;
                    }
                }
                if (bestIdx === -1) return null;
                value = input.slice(cursor, bestIdx);
                cursor = bestIdx;
            } else {
                const match = input.slice(cursor).match(/^\S+/);
                if (match) {
                    value = match[0];
                    cursor += value.length;
                }
            }
            result[token.name] = value.trim();
        } else if (token.type === 'rest') {
             result[token.name] = input.slice(cursor).trim();
             cursor = len;
        }
    }
    
    return result;
}

/**
 * Check if definition is a pattern
 */
export function isPatternDefinition(def: string): boolean {
    return (
        def.includes(" ") ||
        def.includes("$") ||
        (def.includes("{") && def.includes("}"))
    );
}

export function parseParamDefinition(def: string): ParamDefinition {
    // Union types: type1|type2
    if (def.includes('|')) {
        const parts = def.split('|').map(p => p.trim());
        const validators = parts.map(parseParamDefinition);
        
        return {
            name: validators[0]!.name,
            rawDefinition: def,
            validate: (value) => {
                const combined = {};
                for (const v of validators) {
                    const res = v.validate(value);
                    if (res.valid) {
                         if (res.extracted) Object.assign(combined, res.extracted);
                         // If one matched, we treat it as valid. 
                         // But we want to capture variables if any.
                         return { valid: true, extracted: combined };
                    }
                }
                return { valid: false, error: `Does not match any of: ${def}` };
            }
        };
    }

    // Pattern: "loop:$var in $list"
    if (def.includes(' ') || def.includes('$')) {
        let name = "pattern";
        let pattern = def;
        
        const col = def.indexOf(':');
        // Heuristic: "name:pattern..."
        if (col !== -1 && !def.slice(0, col).includes(' ')) {
            name = def.slice(0, col);
            pattern = def.slice(col + 1);
        }

        return {
            name, 
            rawDefinition: def,
            validate: (value) => {
                const extracted = matchPattern(pattern, value);
                if (!extracted) return { valid: false, error: `Value does not match pattern "${pattern}"` };
                return { valid: true, extracted };
            }
        };
    }

    // Simple: "name:type" or "name"
    const [n, t] = def.includes(':') ? def.split(':') : [def, 'any'];
    let name = n!.trim();
    const type = t!.trim();
    
    if (name.endsWith('?')) name = name.slice(0, -1);
    
    const validator = TYPE_VALIDATORS[type] || TYPE_VALIDATORS.any!;
    
    return {
        name,
        rawDefinition: def,
        validate: (value) => {
            if (validator(value)) return { valid: true };
            return { valid: false, error: `Expected ${type}, got ${typeof value}` };
        }
    };
}