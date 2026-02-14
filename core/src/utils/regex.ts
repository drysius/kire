/**
 * Pre-compiled Regular Expressions for Kire
 * Moving these to constants helps V8 optimization and improves performance.
 */

// Tag and Attribute detection
export const TAG_NAME_REGEX = /<([a-zA-Z0-9_\-:]+)/g;
export const ATTR_SCANNER_REGEX = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
export const ELEMENT_SCANNER_REGEX = /<([a-zA-Z0-9_\-:]+)([^>]*?)\/>|<([a-zA-Z0-9_\-:]+)([^>]*?)>([\s\S]*?)<\/\3>/g;

// Directive parsing
export const DIRECTIVE_NAME_REGEX = /^@([a-zA-Z0-9_]+)/;
export const DIRECTIVE_TAG_REGEX = /@([a-zA-Z0-9_]+)/g;
export const DIRECTIVE_END_REGEX = /@end(?![a-zA-Z0-9_])/g;

// Variable and Identifier validation
export const JS_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
export const WHITESPACE_REGEX = /\s+/;

// HTML Escaping
export const HTML_ESCAPE_CHECK_REGEX = /[&<>"']/;
export const HTML_ESCAPE_GLOBAL_REGEX = /[&<>"']/g;

// Stack Trace parsing
export const STACK_LINE_REGEX = /^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/;
export const STACK_GEN_JS_REGEX = /kire-generated\.js:(\d+):(\d+)/;
export const STACK_EVAL_REGEX = /eval:(\d+):(\d+)/;
export const STACK_ANON_REGEX = /<anonymous>:(\d+):(\d+)/;
