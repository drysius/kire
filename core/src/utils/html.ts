/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param unsafe The string to escape.
 * @returns The escaped string.
 */
export function escapeHtml(unsafe: any): string {
	if (unsafe === null || unsafe === undefined) return "";
	const str = String(unsafe);
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
		.replace(/`/g, "&#96;");
}
