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
	const s: string = type === "string" ? unsafe : String(unsafe);

	// "Needs escaping?" check — the dominant cost of escaping in practice, since
	// most interpolated values contain no special characters. For short strings
	// (typical template values) a manual charCode scan beats the regex engine's
	// per-call setup cost; for long strings the regex's optimized scan wins. So
	// dispatch by length. Crossover measured at ~16 chars: below it the scan is
	// up to ~2x faster, above it the regex path is kept identical (no regression).
	const n = s.length;
	if (n <= 16) {
		for (let i = 0; i < n; i++) {
			const c = s.charCodeAt(i);
			// & < > " '
			if (c === 38 || c === 60 || c === 62 || c === 34 || c === 39) {
				return s.replace(HTML_ESCAPE_GLOBAL_REGEX, (m) => ESCAPE_MAP[m]!);
			}
		}
		return s;
	}

	if (!HTML_ESCAPE_CHECK_REGEX.test(s)) return s;
	return s.replace(HTML_ESCAPE_GLOBAL_REGEX, (m) => ESCAPE_MAP[m]!);
}
