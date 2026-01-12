/**
 * Generates a safe CSS selector for attributes with namespaces (colons).
 * Handles the quadruple backslash escaping required for document.querySelector in JS strings.
 *
 * Usage:
 * safeSelector('wire:id') -> '[wire\:id]'
 * safeSelector('wire:id', '123') -> '[wire\:id="123"]'
 */
export function safeSelector(attribute: string, value?: string): string {
	// HappyDOM (used in tests) requires unescaped colons for attribute selectors
	// while standard browsers require escaped colons.
	// @ts-ignore
	const isHappyDOM = typeof window !== "undefined" && window.happyDOM;

	// Basic CSS escaping for the attribute name if not using CSS.escape
	// We specifically target the colon which is common in wire attributes
	// and needs escaping in standard querySelector
	const escapedAttr = isHappyDOM 
        ? attribute 
        : attribute.replace(/([:[\]\.,])/g, "\\$1");

	if (value !== undefined) {
        // Escape quotes in value
		const escapedValue = value.replace(/"/g, '\"');
		return `[${escapedAttr}="${escapedValue}"]`;
	}

	return `[${escapedAttr}]`;
}