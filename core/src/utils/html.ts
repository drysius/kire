const ESCAPE_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#039;",
};

export function escapeHtml(unsafe: any): string {
	if (unsafe === null || unsafe === undefined) return "";
	const type = typeof unsafe;
	if (type === "number" || type === "boolean") return String(unsafe);
    if (type !== "string") unsafe = String(unsafe);
	
	if (!/[&<>"']/.test(unsafe)) return unsafe;

	return unsafe.replace(/[&<>"']/g, (m: string) => ESCAPE_MAP[m]!);
}
