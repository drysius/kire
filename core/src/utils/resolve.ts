/**
 * Resolves a file path using namespaces and dot notation.
 * @param filepath The path to resolve (e.g. "theme.index" or "~/index").
 * @param namespaces The map of registered namespaces.
 * @param mounts The map of mount data.
 * @param locals Data to resolve path placeholders (e.g. {theme: 'dark'}).
 * @param extension Default file extension.
 * @returns The resolved absolute path.
 */
export function resolvePath(
	filepath: string,
	namespaces: Map<string, string>,
	mounts: Map<string, Record<string, any>>,
	locals: Record<string, any> = {},
	extension = "kire",
): string {
	if (!filepath) return filepath;

	let normalized = filepath.replace(/\\/g, "/");

	// Search for matching namespace
	const sortedNamespaces = Array.from(namespaces.keys()).sort(
		(a, b) => b.length - a.length,
	);

	for (const ns of sortedNamespaces) {
		if (normalized.startsWith(ns)) {
			let template = namespaces.get(ns)!;
			const mountData = mounts.get(ns) || {};
			const data = { ...mountData, ...locals };

			// Replace placeholders in template
			template = template.replace(/\{(\w+)\}/g, (_, key) => {
				return data[key] !== undefined ? String(data[key]) : `{${key}}`;
			});

			// Normalize template
			template = template.replace(/\\/g, "/");

			// Handle suffix
			let suffix = normalized.slice(ns.length);

			// Remove leading dot or slash from suffix if present to avoid double separator
			if (suffix.startsWith(".") || suffix.startsWith("/")) {
				suffix = suffix.slice(1);
			}

			// Convert dots to slashes in suffix ONLY if extension is provided (assuming template mode)
			// If extension is empty, we assume exact path mode (e.g. assets/markdown)
			if (extension) {
				suffix = suffix.replace(/\./g, "/");
			}

			normalized = `${template}/${suffix}`;

			// Remove double slashes
			normalized = normalized.replace(/\/+/g, "/");

			// Apply extension
			if (
				extension &&
				!normalized.endsWith(`.${extension}`) &&
				!normalized.startsWith("http")
			) {
				normalized += `.${extension}`;
			}

			return normalized;
		}
	}

	// If no namespace match, fallback to standard resolution
	// Handle simple dot notation for relative paths
	if (!normalized.startsWith("http") && !normalized.startsWith("/")) {
		// Only convert dots if it looks like a dot-path (e.g. "dir.file")
		// Assumption: if it doesn't have an extension yet, we convert dots.
		const hasExtension = /\.[a-zA-Z0-9]+$/.test(normalized);

		if (!hasExtension) {
			normalized = normalized.replace(/\./g, "/");
		}
	}

	if (
		extension &&
		!normalized.endsWith(`.${extension}`) &&
		!normalized.startsWith("http")
	) {
		normalized += `.${extension}`;
	}
	return normalized;
}