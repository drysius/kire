/**
 * Expressões Regulares Pré-compiladas para o Kire.
 * Otimizadas para performance no V8.
 */

// Optimized Object with Null Prototype
export const NullProtoObj = function (this: any) {
    return Object.create(null);
} as unknown as { new <T = any>(): Record<string, T> };


// Detecção de Tags e Atributos
export const TAG_OPEN_REGEX = /^<([a-zA-Z0-9_\-:]+)/;
export const TAG_CLOSE_REGEX = /^<\/([a-zA-Z0-9_\-:]+)>/;
export const ATTR_NAME_BREAK_REGEX = /\s|=|>|\/|\(/;
export const WHITESPACE_REGEX = /\s/;

// Parsing de Diretivas (@nome)
export const DIRECTIVE_NAME_REGEX = /^@([a-zA-Z0-9_]+)/;

// Validação e Extração de Identificadores JS
export const JS_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
export const JS_EXTRACT_IDENTS_REGEX = /(?:['"`].*?['"`])|(?<=\.\s*)[a-zA-Z_$][a-zA-Z0-9_$]*|(?<![a-zA-Z0-9_$])([a-zA-Z_$][a-zA-Z0-9_$]*)(?![a-zA-Z0-9_$])/g;
export const FOR_VAR_EXTRACT_REGEX = /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/;

// Interpolação e Atributos Dinâmicos
export const INTERPOLATION_PURE_REGEX = /^\s*\{\{\s*(.*?)\s*\}\}\s*$/;
export const INTERPOLATION_GLOBAL_REGEX = /\{\{\s*(.*?)\s*\}\}/g;

export const RESERVED_KEYWORDS_REGEX = /^(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|enum|await|true|false|null|of)$/;

// Escaping HTML
export const HTML_ESCAPE_CHECK_REGEX = /[&<>"']/;
export const HTML_ESCAPE_GLOBAL_REGEX = /[&<>"']/g;

// Parser Optimizations
export const TEXT_SCAN_REGEX = /{{|@|</g;
export const NEWLINE_REGEX = /\n/g;
export const QUOTE_REGEX = /['"]/g;

// Compiler Checks
export const INTERPOLATION_START_REGEX = /{{/;
export const AWAIT_KEYWORD_REGEX = /await/;
export const WILDCARD_CHAR_REGEX = /\*/;

/**
 * Regex for detecting varThen variables in generated code.
 * Designed to be used on code where string literals have been stripped.
 */
export const createVarThenRegex = (name: string) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`);
    return new RegExp(`(?<![a-zA-Z0-9_$])${escaped}(?![a-zA-Z0-9_$])`);
};

// String Manipulation
export const QUOTED_STR_CHECK_REGEX = /^['"]/;
export const STRIP_QUOTES_REGEX = /^['"]|['"]$/g;
export const JS_STRINGS_REGEX = /'[^']*'|"[^"]*"|`[^`]*`/g;

export function createFastMatcher(list: (string | RegExp)[]): RegExp {
    const sources = list.map(item => {
        if (item instanceof RegExp) return item.source;
        
        if (item.includes('*')) {
            const parts = item.split('*');
            const escapedParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`));
            return escapedParts.join('.*');
        }

        return item.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`);
    });
    
    // Sort by length (descending) to ensure specific matches come before general ones
    sources.sort((a, b) => b.length - a.length);
    
    return new RegExp(`(?:${sources.join('|')})`);
}
