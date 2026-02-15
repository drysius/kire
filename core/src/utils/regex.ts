/**
 * Expressões Regulares Pré-compiladas para o Kire.
 * Otimizadas para performance no V8.
 */

// Optimized Object with Null Prototype
export type NullProtoObj<T = unknown> = InstanceType<new () => Record<PropertyKey, T>>;
export const NullProtoObj = /* @__PURE__ */ (()=>{const e=function(){};return e.prototype=Object.create(null),Object.freeze(e.prototype),e})() as unknown as { new (): any };


// Detecção de Tags e Atributos
export const TAG_OPEN_REGEX = /^<([a-zA-Z0-9_\-:]+)/;
export const TAG_CLOSE_REGEX = /^<\/([a-zA-Z0-9_\-:]+)>/;
export const ATTR_NAME_BREAK_REGEX = /\s|=|>|\/|\(/;
export const WHITESPACE_REGEX = /\s/;

// Parsing de Diretivas (@nome)
export const DIRECTIVE_NAME_REGEX = /^@([a-zA-Z0-9_]+)/;
export const DIRECTIVE_TAG_REGEX = /@([a-zA-Z0-9_]+)/g;

// Validação e Extração de Identificadores JS
export const JS_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
export const JS_EXTRACT_IDENTS_REGEX = /(?:['"`].*?['"`])|(?<=\.\s*)\b[a-zA-Z_$][a-zA-Z0-9_$]*\b|\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
export const FOR_VAR_EXTRACT_REGEX = /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/;

// Interpolação e Atributos Dinâmicos
export const INTERPOLATION_PURE_REGEX = /^\s*\{\{\s*(.*?)\s*\}\}\s*$/;
export const INTERPOLATION_GLOBAL_REGEX = /\{\{\s*(.*?)\s*\}\}/g;

export const RESERVED_KEYWORDS = new Set([
    "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", 
    "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", 
    "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield", "enum", 
    "await", "true", "false", "null"
]);

// Escaping HTML
export const HTML_ESCAPE_CHECK_REGEX = /[&<>"']/;
export const HTML_ESCAPE_GLOBAL_REGEX = /[&<>"']/g;
