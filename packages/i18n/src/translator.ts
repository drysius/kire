export type TranslationTree = {
	[key: string]: string | TranslationTree;
};

export type Translations = Record<string, TranslationTree>;

export interface TranslatorConfig {
	locale: string;
	fallback: string;
	translations: Translations;
}

/** Resolve a (possibly dotted) key within a locale's translation tree. */
function lookup(tree: TranslationTree | undefined, key: string): string | undefined {
	if (!tree) return undefined;
	if (typeof tree[key] === "string") return tree[key] as string;
	let node: string | TranslationTree | undefined = tree;
	for (const part of key.split(".")) {
		if (node == null || typeof node === "string") return undefined;
		node = node[part];
	}
	return typeof node === "string" ? node : undefined;
}

/** Replace `:name` placeholders (and `{name}` curly form) from a map. */
export function applyReplacements(
	message: string,
	replacements: Record<string, unknown> = {},
): string {
	let out = message;
	for (const key of Object.keys(replacements)) {
		const value = String(replacements[key] ?? "");
		// :Name → capitalized, :NAME → upper, :name → as-is (Laravel convention).
		out = out
			.replace(new RegExp(`:${key}\\b`, "g"), value)
			.replace(new RegExp(`\\{${key}\\}`, "g"), value);
	}
	return out;
}

/**
 * Select the correct plural segment for `count`. Segments are separated by `|`
 * and may carry Laravel-style conditions: `{0} none|{1} one|[2,*] many`.
 */
export function choosePlural(message: string, count: number): string {
	const segments = message.split("|");
	// Explicit conditions first.
	for (const seg of segments) {
		const exact = seg.match(/^\s*\{(\d+)\}\s*(.*)$/s);
		if (exact && Number(exact[1]) === count) return exact[2]!;
		const range = seg.match(/^\s*\[(\d+),\s*(\d+|\*)\]\s*(.*)$/s);
		if (range) {
			const low = Number(range[1]);
			const high = range[2] === "*" ? Infinity : Number(range[2]);
			if (count >= low && count <= high) return range[3]!;
		}
	}
	// Positional fallback: [singular, plural].
	const positional = segments.map((s) =>
		s.replace(/^\s*(\{\d+\}|\[\d+,\s*(\d+|\*)\])\s*/, ""),
	);
	if (positional.length === 1) return positional[0]!;
	return count === 1 ? positional[0]! : positional[positional.length - 1]!;
}

export function createTranslator(config: TranslatorConfig) {
	const resolve = (key: string): string | undefined => {
		const primary = lookup(config.translations[config.locale], key);
		if (primary !== undefined) return primary;
		return lookup(config.translations[config.fallback], key);
	};

	const trans = (
		key: string,
		replacements: Record<string, unknown> = {},
	): string => {
		const message = resolve(key);
		if (message === undefined) return key; // Laravel returns the key when missing.
		return applyReplacements(message, replacements);
	};

	const choice = (
		key: string,
		count: number,
		replacements: Record<string, unknown> = {},
	): string => {
		const message = resolve(key);
		if (message === undefined) return key;
		const chosen = choosePlural(message, count);
		return applyReplacements(chosen, { count, ...replacements });
	};

	return { trans, choice, resolve };
}

export type Translator = ReturnType<typeof createTranslator>;
