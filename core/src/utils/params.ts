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
    string: (value) => typeof value === 'string',
    number: (value) => typeof value === 'number' && !isNaN(value) && isFinite(value),
    boolean: (value) => typeof value === 'boolean',
    any: () => true,
    object: (value) => (typeof value === 'object' && value !== null && !Array.isArray(value)) || typeof value === 'string',
    array: (value) => Array.isArray(value) || typeof value === 'string',
    null: (value) => value === null,
    undefined: (value) => value === undefined,
    function: (value) => typeof value === 'function'
};

/**
 * Registry for custom validators
 */
export const validators = {
    register(type: string, validator: TypeChecker) {
        TYPE_VALIDATORS[type] = validator;
    },
    list() {
        return Object.keys(TYPE_VALIDATORS);
    }
};

/**
 * Helper to escape regex special characters
 */
function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\\]/g, '\\$&');
}

/**
 * Creates a pattern matcher function with syntax:
 * - `$var` - Captures a variable
 * - `$...` - Captures the rest
 * - `{op1/op2}` - Choice (non-capturing)
 * - `{name:op1/op2}` - Named choice (capturing)
 */
function createPatternMatcher(pattern: string): (input: string) => Record<string, string> | null {
    let regex = '^';
    let i = 0;

    while (i < pattern.length) {
        // Rest parameter: $...
        if (pattern.startsWith('$...', i)) {
            regex += '(?<rest>.*)';
            i += 4;
            continue;
        }

        // Variable: $var
        if (pattern[i] === '$') {
            const varStart = i + 1;
            let varEnd = varStart;
            while (varEnd < pattern.length && /\w/.test(pattern[varEnd])) {
                varEnd++;
            }

            if (varEnd === varStart) {
                // Not a variable, treat as literal $
                regex += '\\$';
                i++;
                continue;
            }

            const varName = pattern.slice(varStart, varEnd);
            let capturePattern = '[^\\s]+';

            if (varEnd < pattern.length) {
                const nextChar = pattern[varEnd];
                if (nextChar === ' ') {
                    capturePattern = '.*?';
                } else if (nextChar !== '$' && nextChar !== '{') {
                    let literalEnd = varEnd;
                    while (literalEnd < pattern.length &&
                        pattern[literalEnd] !== ' ' &&
                        pattern[literalEnd] !== '$' &&
                        pattern[literalEnd] !== '{') {
                        literalEnd++;
                    }
                    const nextLiteral = pattern.slice(varEnd, literalEnd);
                    if (nextLiteral) {
                        const firstChar = escapeRegex(nextLiteral[0]!);
                        capturePattern = `.*?(?=\\s|${firstChar}|$)'`;
                    }
                }
            }

            regex += `(?<${varName}>${capturePattern})`;
            i = varEnd;
            continue;
        }

        // Choices: {name:op1/op2} or {op1/op2}
        if (pattern[i] === '{') {
            const end = pattern.indexOf('}', i);
            if (end !== -1) {
                const content = pattern.slice(i + 1, end);
                const colon = content.indexOf(':');

                if (colon !== -1) {
                    const name = content.slice(0, colon);
                    const choices = content.slice(colon + 1).split('/').map(escapeRegex).join('|');
                    regex += `(?<${name}>${choices})`;
                } else {
                    const choices = content.split('/').map(escapeRegex).join('|');
                    regex += `(?:${choices})`;
                }

                i = end + 1;
                continue;
            }
        }

        // Literal text
        let literalStart = i;
        while (i < pattern.length &&
            pattern[i] !== ' ' &&
            pattern[i] !== '$' &&
            pattern[i] !== '{') {
            i++;
        }

        if (literalStart < i) {
            const literal = pattern.slice(literalStart, i);
            regex += escapeRegex(literal);
        }

        // Spaces
        if (i < pattern.length && pattern[i] === ' ') {
            regex += '\\s+';
            i++;
            while (i < pattern.length && pattern[i] === ' ') i++;
        } else if (literalStart === i) {
            i++;
        }
    }

    regex += '$';
    const compiled = new RegExp(regex);

    return (input: string) => {
        if (typeof input !== 'string') return null;
        const match = compiled.exec(input.trim());
        if (!match) return null;

        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(match.groups || {})) {
            if (value !== undefined) {
                result[key] = value;
            }
        }
        return result;
    };
}

/**
 * Check if definition is a pattern
 */
export function isPatternDefinition(def: string): boolean {
    return (
        def.includes(' ') ||
        def.includes('$') ||
        (def.includes('{') && def.includes('}'))
    );
}

/**
 * Parse parameter definition
 */
export function parseParamDefinition(def: string): ParamDefinition {
    // 1. Handle Unions
    if (def.includes('|')) {
        // If it looks like a pattern, don't split by pipe immediately unless we are sure.
        // But our simple pattern syntax doesn't use pipe except inside choice {} blocks.
        // So safe to split by top-level pipe?
        // Wait, {op1/op2} uses slash.
        // So pipe is reserved for Union Types.
        
        const parts = def.split('|').map(p => p.trim());
        const validators = parts.map(p => parseParamDefinition(p));

        return {
            name: validators[0]!.name,
            rawDefinition: def,
            validate: (value: any) => {
                const errors: string[] = [];
                let combinedExtracted: Record<string, any> = {};

                for (const validator of validators) {
                    const result = validator.validate(value);
                    if (result.valid) {
                        if (validator.name && validator.name !== 'pattern_match') {
                            combinedExtracted[validator.name] = value;
                        }
                        if (result.extracted) {
                            Object.assign(combinedExtracted, result.extracted);
                        }
                        return { valid: true, extracted: combinedExtracted };
                    }
                    errors.push(result.error || 'Invalid');
                }

                return {
                    valid: false,
                    error: `Value didn't match: ${errors.join(' OR ')}`
                };
            }
        };
    }

    // 2. Handle Patterns
    if (isPatternDefinition(def)) {
        // Check for name prefix "name:pattern"
        let name = 'pattern_match';
        let pattern = def;
        
        // Simple heuristic: if it starts with "word:" and rest is pattern
        const colonIndex = def.indexOf(':');
        if (colonIndex !== -1) {
             const possibleName = def.slice(0, colonIndex);
             // Ensure name is a valid identifier and not part of the pattern structure like {name:opt}
             // Actually {name:opt} is inside braces.
             // If we have "loop:$lhs...", "loop" is name.
             if (/^[a-zA-Z_]\w*$/.test(possibleName)) {
                 name = possibleName;
                 pattern = def.slice(colonIndex + 1);
             }
        }

        const matcher = createPatternMatcher(pattern);

        return {
            name,
            rawDefinition: def,
            validate: (value: any) => {
                if (typeof value !== 'string') {
                    return { valid: false, error: 'Expected string for pattern matching' };
                }
                const extracted = matcher(value);
                if (!extracted) {
                    return { valid: false, error: `Value does not match pattern: ${pattern}` };
                }
                return { valid: true, extracted };
            }
        };
    }

    // 3. Handle Simple Types "name:type"
    let [namePart, typeDef = 'any'] = def.split(':');
    let name = namePart!.trim();
    
    // Handle optional indicator '?' in name (e.g., "param?:type")
    if (name.endsWith('?')) {
        name = name.slice(0, -1);
    }
    
    const validator = TYPE_VALIDATORS[typeDef.trim()] || TYPE_VALIDATORS['any']!;

    return {
        name: name,
        rawDefinition: def,
        validate: (value: any) => {
            if (validator(value)) {
                return { valid: true };
            }
            return { valid: false, error: `Expected ${typeDef}, got ${typeof value}` };
        }
    };
}
