/**
 * Enhanced parameter parser with better pattern matching and validation
 */

interface ParamDefinition {
    name: string;
    rawDefinition: string;
    validate: (value: any) => ValidationResult;
    pattern?: RegExp; // For caching
    extract?: (value: string) => Record<string, any>; // Custom extractor
}

interface ValidationResult {
    valid: boolean;
    extracted?: Record<string, any>;
    error?: string;
}

type TypeChecker = (value: any) => boolean;

/**
 * Type validators registry for extensibility
 */
const TYPE_VALIDATORS: Record<string, TypeChecker> = {
    string: (value) => typeof value === 'string',
    number: (value) => typeof value === 'number' && !isNaN(value) && isFinite(value),
    integer: (value) => Number.isInteger(value),
    boolean: (value) => typeof value === 'boolean',
    any: () => true,
    object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
    array: Array.isArray,
    null: (value) => value === null,
    undefined: (value) => value === undefined,
    function: (value) => typeof value === 'function',
    symbol: (value) => typeof value === 'symbol',
    date: (value) => value instanceof Date && !isNaN(value.getTime()),
    regexp: (value) => value instanceof RegExp,
    buffer: (value) => value instanceof Buffer,
    promise: (value) => value && typeof value.then === 'function',
    // Special types
    email: (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    url: (value) => {
        if (typeof value !== 'string') return false;
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    },
    uuid: (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    hex: (value) => typeof value === 'string' && /^[0-9a-f]+$/i.test(value),
    base64: (value) => typeof value === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value),
    ipv4: (value) => typeof value === 'string' && /^(\d{1,3}\.){3}\d{1,3}$/.test(value),
    variable: (value) => typeof value === 'string' && /^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*)*$/.test(value),
    json: (value) => {
        if (typeof value === 'string') {
            try {
                JSON.parse(value);
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }
};

/**
 * Parse parameter definition with enhanced features
 */
export function parseParamDefinition(def: string): ParamDefinition {
    // 0. Handle Union Types first
    if (def.includes('|')) {
        // Split by pipe, but be careful about pipes inside regex patterns if we supported them inline (we assume we don't for now)
        const parts = def.split('|').map(p => p.trim());
        const validators = parts.map(p => parseParamDefinition(p));
        
        return {
            name: validators[0]!.name, // Use the name of the first option as the primary name?
            rawDefinition: def,
            validate: (value: any) => {
                const errors: string[] = [];
                let combinedExtracted: Record<string, any> = {};

                for (const validator of validators) {
                    const result = validator.validate(value);
                    if (result.valid) {
                        // If valid, capture the value under the validator's name
                        // This allows accessing parameters by their specific union name (e.g. "statement")
                        if (validator.name && validator.name !== 'pattern_match') {
                            combinedExtracted[validator.name] = value;
                        }

                        // Merge extractions if valid (e.g. from patterns)
                        if (result.extracted) {
                             Object.assign(combinedExtracted, result.extracted);
                        }
                        return { valid: true, extracted: combinedExtracted };
                    }
                    errors.push(result.error || 'Invalid');
                }
                
                return {
                    valid: false,
                    error: `Value didn't match any of the allowed types/patterns: ${errors.join(' OR ')}`
                };
            }
        };
    }

    // 1. Check if it's a pattern matcher
    if (isPatternDefinition(def)) {
        return createEnhancedPatternMatcher(def);
    }
    
    // 2. Parse standard type definition
    const [name, typeDef = 'any'] = def.split(':');
    
    return {
        name: name!.trim(),
        rawDefinition: def,
        validate: createTypeValidator(typeDef.trim())
    };
}

/**
 * Check if definition is a pattern
 */
function isPatternDefinition(def: string): boolean {
    // Pattern if it has {vars} and spaces, OR uses special pattern syntax
    return (
        (def.includes('{') && def.includes('}') && def.includes(' ')) ||
        def.startsWith('regex:') ||
        def.startsWith('pattern:')
    );
}

/**
 * Create enhanced pattern matcher with better syntax
 */
function createEnhancedPatternMatcher(def: string): ParamDefinition {
    // Support different pattern syntaxes
    
    // 1. Named regex pattern: "name:regex:/^(\d+)-(.+)$/"
    if (def.startsWith('regex:') || def.includes(':regex:')) {
        return createRegexMatcher(def);
    }
    
    // 2. Named pattern: "loop:{item} in {list}"
    // Handle potential colons inside the pattern itself (e.g. {op:in/of})
    if (def.includes(':') && !def.startsWith('{')) {
        const firstColon = def.indexOf(':');
        // Ensure the colon isn't part of a regex pattern or something else if we expand syntax
        // But for named patterns, the name is always first.
        const name = def.substring(0, firstColon);
        const pattern = def.substring(firstColon + 1);
        return buildPatternMatcher(name.trim(), pattern.trim());
    }
    
    // 3. Anonymous pattern: "{item} in {list}"
    return buildPatternMatcher('pattern_match', def);
}

/**
 * Build pattern matcher from string
 */
function buildPatternMatcher(name: string, pattern: string): ParamDefinition {
    // Parse pattern tokens
    const tokens = parsePatternTokens(pattern);
    const regex = compilePatternToRegex(tokens);
    
    return {
        name,
        rawDefinition: pattern,
        pattern: regex,
        validate: (value: any) => {
            if (typeof value !== 'string') {
                return {
                    valid: false,
                    error: `Expected string for pattern matching, got ${typeof value}`
                };
            }
            
            const match = regex.exec(value);
            if (!match || !match.groups) {
                return {
                    valid: false,
                    error: `Value does not match pattern: ${pattern}`
                };
            }
            
            return {
                valid: true,
                extracted: match.groups
            };
        }
    };
}

/**
 * Parse pattern into tokens
 */
interface PatternToken {
    type: 'literal' | 'variable' | 'choice';
    value: string;
    variableName?: string;
    choices?: string[];
}

function parsePatternTokens(pattern: string): PatternToken[] {
    const tokens: PatternToken[] = [];
    let pos = 0;
    
    while (pos < pattern.length) {
        // Check for variable: {name}
        if (pattern[pos] === '{') {
            const end = pattern.indexOf('}', pos);
            if (end === -1) throw new Error(`Unclosed brace at position ${pos}`);
            
            const content = pattern.substring(pos + 1, end);
            
            // Check for choice variable: {op:in/of}
            if (content.includes(':')) {
                const [varName, choices] = content.split(':');
                tokens.push({
                    type: 'choice',
                    variableName: varName!.trim(),
                    choices: choices!.split('/').map(c => c.trim()),
                    value: content
                });
            } else {
                // Simple variable
                tokens.push({
                    type: 'variable',
                    variableName: content.trim(),
                    value: content
                });
            }
            
            pos = end + 1;
        } else {
            // Find next brace or end
            const nextBrace = pattern.indexOf('{', pos);
            const end = nextBrace === -1 ? pattern.length : nextBrace;
            
            if (pos < end) {
                const literal = pattern.substring(pos, end);
                if (literal.trim()) {
                    tokens.push({
                        type: 'literal',
                        value: literal.trim()
                    });
                }
                pos = end;
            }
        }
    }
    
    return tokens;
}

/**
 * Compile tokens to regex
 */
function compilePatternToRegex(tokens: PatternToken[]): RegExp {
    let regexParts: string[] = ['^'];
    const variables: string[] = [];
    
    for (const token of tokens) {
        switch (token.type) {
            case 'literal':
                // Escape regex special chars
                regexParts.push(escapeRegex(token.value).replace(/\s+/g, '\\s+'));
                break;
                
            case 'variable':
                variables.push(token.variableName!);
                regexParts.push(`(?<${token.variableName}>\\S+)`);
                break;
                
            case 'choice':
                variables.push(token.variableName!);
                const choices = token.choices!.map(escapeRegex).join('|');
                regexParts.push(`(?<${token.variableName}>${choices})`);
                break;
        }
    }
    
    regexParts.push('$');
    return new RegExp(regexParts.join(''));
}

/**
 * Create regex matcher from definition
 */
function createRegexMatcher(def: string): ParamDefinition {
    const match = def.match(/^(?:(\w+):)?regex:(.+)$/);
    if (!match) throw new Error(`Invalid regex pattern: ${def}`);
    
    const [, name = 'regex_match', pattern] = match;
    const flagsMatch = pattern!.match(/^\/(.+)\/([gimsuy]*)$/);
    
    if (!flagsMatch) throw new Error(`Invalid regex format: ${pattern}`);
    
    const [, regexPattern, flags = ''] = flagsMatch;
    
    return {
        name,
        rawDefinition: def,
        pattern: new RegExp(regexPattern!, flags),
        validate: (value: any) => {
            if (typeof value !== 'string') {
                return {
                    valid: false,
                    error: `Expected string for regex matching`
                };
            }
            
            const regex = new RegExp(regexPattern!, flags);
            const match = regex.exec(value);
            
            if (!match) {
                return { valid: false, error: `Value does not match regex: ${pattern}` };
            }
            
            // Extract named groups if available
            const extracted = (match.groups || {}) as Record<string,any>;
            
            // Also capture numbered groups
            for (let i = 0; i < match.length; i++) {
                extracted[`$${i}`] = match[i];
            }
            
            return {
                valid: true,
                extracted
            };
        }
    };
}

/**
 * Create type validator
 */
function createTypeValidator(typeDef: string): (value: any) => ValidationResult {
    const types = typeDef.split('|').map(t => t.trim());
    
    return (value: any) => {
        const errors: string[] = [];
        
        for (const type of types) {
            const validator = getTypeValidator(type);
            if (validator(value)) {
                return { valid: true };
            }
            errors.push(type);
        }
        
        return {
            valid: false,
            error: `Expected ${types.join(' or ')}, got ${getTypeDescription(value)}`
        };
    };
}

/**
 * Get validator for type with custom type support
 */
function getTypeValidator(type: string): TypeChecker {
    // Custom type with parameters: "array<string>", "range:1-10", "length:5"
    if (type.includes('<')) {
        return createGenericValidator(type);
    }
    
    if (type.includes(':')) {
        return createParameterizedValidator(type);
    }
    
    // Built-in type
    const validator = TYPE_VALIDATORS[type];
    if (validator) return validator;
    
    // Default: string equals check
    return (value) => value === type;
}

/**
 * Create validator for generic types
 */
function createGenericValidator(type: string): TypeChecker {
    const match = type.match(/^(\w+)<(.+)>$/);
    if (!match) return () => false;
    
    const [, baseType, innerType] = match;
    
    switch (baseType) {
        case 'array':
            const itemValidator = getTypeValidator(innerType!);
            return (value) => 
                Array.isArray(value) && 
                value.every(item => itemValidator(item));
                
        case 'tuple':
            const types = innerType!.split(',').map(t => t.trim());
            return (value) => 
                Array.isArray(value) && 
                value.length === types.length &&
                value.every((item, i) => getTypeValidator(types[i]!)(item));
                
        case 'record':
            const [keyType, valueType] = innerType!.split(',').map(t => t.trim());
            const keyValidator = getTypeValidator(keyType || 'string');
            const valValidator = getTypeValidator(valueType || 'any');
            
            return (value) => {
                if (typeof value !== 'object' || value === null) return false;
                
                for (const [k, v] of Object.entries(value)) {
                    if (!keyValidator(k) || !valValidator(v)) return false;
                }
                return true;
            };
            
        default:
            return () => false;
    }
}

/**
 * Create validator for parameterized types
 */
function createParameterizedValidator(type: string): TypeChecker {
    const [baseType, params] = type.split(':');
    
    switch (baseType) {
        case 'range':
            const [min, max] = params!.split('-').map(Number);
            return (value) => 
                typeof value === 'number' && 
                value >= min! && 
                value <= max!;
                
        case 'length':
            const length = parseInt(params!);
            return (value) => 
                (typeof value === 'string' || Array.isArray(value)) && 
                value.length === length;
                
        case 'min':
            const minVal = Number(params);
            return (value) => 
                typeof value === 'number' && 
                value >= minVal;
                
        case 'max':
            const maxVal = Number(params);
            return (value) => 
                typeof value === 'number' && 
                value <= maxVal;
                
        case 'enum':
            const enumValues = params!.split('/');
            return (value) => enumValues.includes(String(value));
                
        default:
            return () => false;
    }
}

/**
 * Utility functions
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getTypeDescription(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (value instanceof Date) return 'Date';
    if (value instanceof RegExp) return 'RegExp';
    if (value instanceof Buffer) return 'Buffer';
    return typeof value;
}

/**
 * Registry for custom validators (for extensibility)
 */
export const validators = {
    register(type: string, validator: TypeChecker) {
        TYPE_VALIDATORS[type] = validator;
    },
    
    list() {
        return Object.keys(TYPE_VALIDATORS);
    }
};