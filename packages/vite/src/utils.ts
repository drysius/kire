import path from "node:path";
import type { KireViteInput } from "./types";

const GLOB_MAGIC_REGEX = /[*?[\]{}()!]/;
const REGEXP_ESCAPED_CHARS = /[.+^${}()|[\]\\]/g;

export function normalizeSlashes(value: string): string {
	return value.replace(/\\/g, "/");
}

export function trimSlashes(value: string): string {
	return value.replace(/^\/+|\/+$/g, "");
}

export function toArray<T>(value?: T | T[] | null): T[] {
	if (value === undefined || value === null) return [];
	return Array.isArray(value) ? value : [value];
}

export function unique<T>(values: T[]): T[] {
	return Array.from(new Set(values));
}

export function normalizeEntry(entry: string): string {
	let normalized = normalizeSlashes(entry.trim());
	while (normalized.startsWith("./")) normalized = normalized.slice(2);
	normalized = normalized.replace(/^\/+/, "");
	return normalized;
}

export function normalizeInput(input?: KireViteInput): string[] {
	return unique(
		toArray(input)
			.map((item) => normalizeEntry(String(item)))
			.filter(Boolean),
	);
}

export function isGlobPattern(value: string): boolean {
	return GLOB_MAGIC_REGEX.test(value);
}

export function extractGlobBase(pattern: string): string {
	const normalized = normalizeSlashes(pattern);
	const wildcardIndex = normalized.search(GLOB_MAGIC_REGEX);
	let base = wildcardIndex === -1 ? normalized : normalized.slice(0, wildcardIndex);
	base = base.replace(/\/+$/, "");
	if (!base) return ".";
	return base;
}

export function globToRegExp(globPattern: string): RegExp {
	const pattern = normalizeSlashes(globPattern);
	let regex = "^";

	for (let i = 0; i < pattern.length; i++) {
		const char = pattern[i]!;
		if (char === "*") {
			const next = pattern[i + 1];
			if (next === "*") {
				regex += ".*";
				i++;
			} else {
				regex += "[^/]*";
			}
			continue;
		}

		if (char === "?") {
			regex += ".";
			continue;
		}

		regex += char.replace(REGEXP_ESCAPED_CHARS, "\\$&");
	}

	regex += "$";
	return new RegExp(regex);
}

export function matchesRefresh(
	file: string,
	refresh: boolean | string[] | undefined,
	root = process.cwd(),
): boolean {
	const absoluteFile = normalizeSlashes(path.resolve(file));
	const relativeFile = normalizeSlashes(path.relative(root, absoluteFile));

	if (refresh === false) return false;
	if (refresh === true || refresh === undefined) {
		return absoluteFile.endsWith(".kire");
	}

	for (const rawPattern of refresh) {
		const pattern = normalizeSlashes(rawPattern).replace(/^\.\//, "");
		if (!pattern) continue;

		if (!isGlobPattern(pattern)) {
			if (pattern.startsWith(".") && absoluteFile.endsWith(pattern)) return true;
			if (relativeFile === pattern || relativeFile.endsWith(`/${pattern}`)) return true;
			if (absoluteFile === pattern || absoluteFile.endsWith(`/${pattern}`)) return true;
			continue;
		}

		const matcher = globToRegExp(pattern);
		if (matcher.test(relativeFile) || matcher.test(absoluteFile)) return true;
	}

	return false;
}

export function isCssFile(file: string): boolean {
	return /\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/i.test(file);
}

export function isJsFile(file: string): boolean {
	return /\.(m?js|cjs|ts|mts|cts|jsx|tsx)$/i.test(file);
}

export function isImageFile(file: string): boolean {
	return /\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(file);
}
