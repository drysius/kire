/**
 * Generates a safe CSS selector for attributes with namespaces (colons).
 * Handles the quadruple backslash escaping required for document.querySelector in JS strings.
 * 
 * Usage:
 * safeSelector('wire:id') -> '[wire\\:id]'
 * safeSelector('wire:id', '123') -> '[wire\\:id="123"]'
 */
export function safeSelector(attribute: string, value?: string): string {
    // Escape colons with quadruple backslash
    const escapedAttr = attribute.replace(/:/g, '\\:');
    
    if (value !== undefined) {
        return `[${escapedAttr}="${value}"]`;
    }
    
    return `[${escapedAttr}]`;
}
