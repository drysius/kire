function createNullProtoObj<T extends object = Record<string, never>>(): T {
	return Object.create(null);
}

export async function fetchIcon(
	iconName: string,
	apiUrl: string,
	queryParams: Record<string, string> = createNullProtoObj<
		Record<string, string>
	>(),
	cache?: Record<string, string>,
): Promise<string> {
	// Create a cache key that includes the query parameters to differentiate variants
	// Sort keys to ensure stability
	const queryKeys = Object.keys(queryParams).sort();
	const queryString = queryKeys
		.map((k) => `${k}=${encodeURIComponent(queryParams[k]!)}`)
		.join("&");
	const cacheKey = `${iconName}?${queryString}`;

	if (cache?.[cacheKey]) {
		return cache[cacheKey]!;
	}

	try {
		let prefix = "";
		let name = "";

		if (iconName.includes(":")) {
			[prefix, name] = iconName.split(":") as [string, string];
		} else if (iconName.includes("-")) {
			const parts = iconName.split("-");
			prefix = parts[0] as string;
			name = parts.slice(1).join("-");
		} else {
			prefix = "mdi";
			name = iconName;
		}

		// Validate prefix/name so they cannot inject path segments or query into
		// the API URL (e.g. "mdi:../../admin" or "mdi:x?token=…").
		const VALID = /^[a-z0-9-]+$/i;
		if (!VALID.test(prefix) || !VALID.test(name)) {
			return `<!-- Invalid icon name: ${iconName.replace(/[<>]/g, "")} -->`;
		}

		// Construct URL with query params
		let url = `${apiUrl}/${prefix}/${name}.svg`;
		if (queryString) {
			url += `?${queryString}`;
		}

		const response = await fetch(url);
		if (!response.ok) {
			console.warn(`Failed to fetch icon: ${iconName}`);
			return `<!-- Icon not found: ${iconName} -->`;
		}

		const svg = await response.text();
		if (cache) {
			cache[cacheKey] = svg;
		}
		return svg;
	} catch (e) {
		console.error(`Error fetching icon ${iconName}:`, e);
		return `<!-- Error loading icon: ${iconName} -->`;
	}
}

/** Constant attribute-parsing regex — never built from user input (no ReDoS). */
const SVG_ATTR_REGEX = /([\w:-]+)\s*=\s*"([^"]*)"/g;

function escapeAttrValue(value: string): string {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/**
 * Merge a class name and extra attributes into an `<svg>`'s opening tag.
 *
 * Parses the existing attributes with a fixed regex and rebuilds the tag — it
 * never constructs a RegExp from a caller-supplied key (which previously allowed
 * a ReDoS / malformed-regex via attribute names) — and escapes attribute values.
 */
export function processSvgAttributes(
	svg: string,
	className?: string,
	attributes: Record<string, string> = {},
): string {
	if (!svg.startsWith("<svg")) return svg;

	const close = svg.indexOf(">");
	if (close === -1) return svg;

	const openTag = svg.slice(4, close); // attributes portion, after "<svg"
	const rest = svg.slice(close); // ">…</svg>"

	const attrs = new Map<string, string>();
	SVG_ATTR_REGEX.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = SVG_ATTR_REGEX.exec(openTag)) !== null) {
		attrs.set(match[1]!, match[2]!);
	}

	if (className) {
		const existing = attrs.get("class");
		attrs.set("class", existing ? `${className} ${existing}` : className);
	}
	for (const [key, value] of Object.entries(attributes)) {
		attrs.set(key, value);
	}

	let rebuilt = "<svg";
	// Emit class first (stable, matches the prior behavior), then the rest.
	const classVal = attrs.get("class");
	if (classVal !== undefined) {
		rebuilt += ` class="${escapeAttrValue(classVal)}"`;
		attrs.delete("class");
	}
	for (const [key, value] of attrs) rebuilt += ` ${key}="${escapeAttrValue(value)}"`;
	return rebuilt + rest;
}
