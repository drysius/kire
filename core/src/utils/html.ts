const ESCAPE_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#039;",
	"`": "&#96;",
};

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param unsafe The string to escape.
 * @returns The escaped string.
 */
export function escapeHtml(unsafe: any): string {
	if (unsafe === null || unsafe === undefined) return "";
	if (typeof unsafe === "number" || typeof unsafe === "boolean") return String(unsafe);
	
	const str = String(unsafe);
	return str.replace(/[&<>"'`]/g, (m) => ESCAPE_MAP[m]!);
}
