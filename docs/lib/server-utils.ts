import fs from "node:fs";
import path from "node:path";

type DocsContext = any;

function stripFrontmatter(source: string): string {
	const normalized = String(source || "").replace(/^\uFEFF/, "");
	const match = normalized.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
	if (!match) return normalized;
	return normalized.slice(match[0].length);
}

export function createDocsMarkdownReader(options: {
	viewsRoot: string;
	production: boolean;
}) {
	const cache = new Map<string, string>();
	const viewsRoot = String(options.viewsRoot || "").trim();
	const isProduction = options.production === true;

	return function readDocsMarkdown(relativeFile: string): string {
		const key = String(relativeFile || "").trim();
		if (!key) return "";

		if (isProduction && cache.has(key)) {
			return cache.get(key) || "";
		}

		try {
			const absolutePath = path.resolve(viewsRoot, key);
			const source = fs.readFileSync(absolutePath, "utf8");
			const stripped = stripFrontmatter(source);
			if (isProduction) cache.set(key, stripped);
			return stripped;
		} catch {
			return "";
		}
	};
}

export function redirect(context: DocsContext, to: string, status = 302) {
	context.set.status = status;
	context.set.headers.Location = to;
	return "";
}

export function parseCookieValue(cookieHeader: string, key: string): string {
	const source = String(cookieHeader || "");
	if (!source) return "";

	const chunks = source.split(";");
	for (const chunk of chunks) {
		const part = chunk.trim();
		if (!part) continue;

		const splitAt = part.indexOf("=");
		if (splitAt <= 0) continue;

		const name = part.slice(0, splitAt).trim();
		if (name !== key) continue;

		const raw = part.slice(splitAt + 1);
		try {
			return decodeURIComponent(raw);
		} catch {
			return raw;
		}
	}

	return "";
}
