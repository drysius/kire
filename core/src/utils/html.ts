import { HTML_ESCAPE_CHECK_REGEX, HTML_ESCAPE_GLOBAL_REGEX } from "./regex";

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
	
	if (!HTML_ESCAPE_CHECK_REGEX.test(unsafe)) return unsafe;

	return unsafe.replace(HTML_ESCAPE_GLOBAL_REGEX, (m: string) => ESCAPE_MAP[m]!);
}
