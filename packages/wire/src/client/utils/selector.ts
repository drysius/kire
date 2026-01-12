/**
 * Generates a safe CSS selector for attributes with namespaces (colons).
 * Handles the quadruple backslash escaping required for document.querySelector in JS strings.
 *
 * Usage:
 * safeSelector('wire:id') -> '[wire\\:id]'
 * safeSelector('wire:id', '123') -> '[wire\\:id="123"]'
 */
export function safeSelector(attribute: string, value?: string): string {
	// HappyDOM (used in tests) requires unescaped colons for attribute selectors
	// while standard browsers require escaped colons.
	// @ts-ignore
	const isHappyDOM = typeof window !== "undefined" && window.happyDOM;

	const escapedAttr = isHappyDOM ? attribute : attribute.replace(/:/g, "\\:");

	if (value !== undefined) {
		return `[${escapedAttr}="${value}"]`;
	}

	return `[${escapedAttr}]`;
}
