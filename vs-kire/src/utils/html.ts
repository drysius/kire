/**
 * HTML void elements: never have children and never take a closing tag.
 * Single source of truth for diagnostics, auto-close and formatting.
 */
export const HTML_VOID_ELEMENTS: ReadonlySet<string> = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);

export function isHtmlVoidElement(tagName: string): boolean {
	return HTML_VOID_ELEMENTS.has(tagName.toLowerCase());
}
