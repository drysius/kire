/**
 * Pre-compiled Regular Expressions for Kire
 * Moving these to constants helps V8 optimization and improves performance.
 */

// Optimized Object with Null Prototype
export type NullProtoObj<T = unknown> = InstanceType<new () => Record<PropertyKey, T>>;
export const NullProtoObj = /* @__PURE__ */ (()=>{const e=function(){};return e.prototype=Object.create(null),Object.freeze(e.prototype),e})() as unknown as { new (): any };

// Tag and Attribute detection
export const TAG_NAME_REGEX = /<([a-zA-Z0-9_\-:]+)/g;
// thanks https://stackoverflow.com/questions/317053/regular-expression-for-extracting-tag-attributes
export const ATTR_SCANNER_REGEX = /([^\r\n\t\f\v= '"]+)(?:=(["'])?((?:.(?!\2?\s+(?:\S+)=|\2))+.)\2?)?/g;
export const ELEMENT_SCANNER_REGEX = /<([a-zA-Z0-9_\-:]+)([^>]*?)\/>|<([a-zA-Z0-9_\-:]+)([^>]*?)>([\s\S]*?)<\/\3>/g;

// Directive parsing
export const DIRECTIVE_NAME_REGEX = /^@([a-zA-Z0-9_]+)/;
export const DIRECTIVE_TAG_REGEX = /@([a-zA-Z0-9_]+)/g;
export const DIRECTIVE_END_REGEX = /@end(?![a-zA-Z0-9_])/g;

// Variable and Identifier validation
export const JS_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
export const WHITESPACE_REGEX = /\s+/;

export const RESERVED_KEYWORDS = new Set([
    "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", 
    "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "return", 
    "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield", "enum", 
    "await", "true", "false", "null"
]);

// HTML Escaping
export const HTML_ESCAPE_CHECK_REGEX = /[&<>"']/;
export const HTML_ESCAPE_GLOBAL_REGEX = /[&<>"']/g;

// Stack Trace parsing
export const STACK_LINE_REGEX = /^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/;
export const STACK_GEN_JS_REGEX = /kire-generated\.js:(\d+):(\d+)/;
export const STACK_EVAL_REGEX = /eval:(\d+):(\d+)/;
export const STACK_ANON_REGEX = /<anonymous>:(\d+):(\d+)/;
