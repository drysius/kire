import { NullProtoObj } from "../../../core/src/utils/regex";

export async function fetchIcon(
	iconName: string,
	apiUrl: string,
	queryParams: Record<string, string> = new NullProtoObj(),
	cache?: Map<string, string>,
): Promise<string> {
	// Create a cache key that includes the query parameters to differentiate variants
	// Sort keys to ensure stability
	const queryKeys = Object.keys(queryParams).sort();
	const queryString = queryKeys
		.map((k) => `${k}=${encodeURIComponent(queryParams[k]!)}`)
		.join("&");
	const cacheKey = `${iconName}?${queryString}`;

	if (cache?.has(cacheKey)) {
		return cache.get(cacheKey)!;
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
			cache.set(cacheKey, svg);
		}
		return svg;
	} catch (e) {
		console.error(`Error fetching icon ${iconName}:`, e);
		return `<!-- Error loading icon: ${iconName} -->`;
	}
}

export function processSvgAttributes(
	svg: string,
	className?: string,
	attributes: Record<string, string> = {},
): string {
	if (!svg.startsWith("<svg")) return svg;

	let finalSvg = svg;

	// Handle Class
	if (className) {
		if (finalSvg.includes('class="')) {
			finalSvg = finalSvg.replace('class="', `class="${className} `);
		} else {
			finalSvg = finalSvg.replace("<svg", `<svg class="${className}"`);
		}
	}

	// Handle remaining HTML attributes
	for (const [key, value] of Object.entries(attributes)) {
		// Simple regex to check if attribute exists (basic support)
		const regex = new RegExp(`${key}="[^"]*"`);
		if (regex.test(finalSvg)) {
			finalSvg = finalSvg.replace(regex, `${key}="${value}"`);
		} else {
			finalSvg = finalSvg.replace("<svg", `<svg ${key}="${value}"`);
		}
	}

	return finalSvg;
}
