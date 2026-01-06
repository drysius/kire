import { join } from "./path";

/**
 * Resolves a file path based on a root directory, aliases, and optional current file context.
 * Handles Windows drive letters, absolute paths, and URL exclusions.
 *
 * @param filepath - The path to resolve (can be relative, absolute, or an alias).
 * @param root - The root directory to resolve relative paths against.
 * @param alias - A map of path aliases (e.g., { "@": "src/" }).
 * @param extension - Optional default extension to append if missing.
 * @param currentFile - Optional path of the current file to resolve relative imports against.
 * @returns The resolved, normalized absolute path (using forward slashes).
 */
export function resolvePath(
	filepath: string,
	root: string,
	alias: Record<string, string>,
	extension?: string,
	currentFile?: string,
): string {
	if (!filepath) return filepath;

	// Skip URL paths
	if (filepath.startsWith("http://") || filepath.startsWith("https://")) {
		return filepath;
	}

	// Normalize slashes: convert backslashes to forward slashes and remove duplicates
	let resolved = filepath.replace(/\\/g, "/").replace(/(?<!:)\/+/g, "/");
	const normalizedRoot = root.replace(/\\/g, "/").replace(/\/\/$/, "");

	// Check if path is already absolute (Unix or Windows)
	const isWindowsAbsolute = /^[a-zA-Z]:\/$/.test(resolved);
	
	// Handle Aliases
	// Optimization: Iterate directly. If strict ordering is required by the user,
	// the alias object key order is usually respected in modern JS engines,
	// or the user should pass sorted keys.
	// We use startsWith for O(1) prefix check instead of RegExp overhead.
	let matchedAlias = false;
	const aliasKeys = Object.keys(alias);
	
	// Sort by length (descending) ensures longest prefix matches first (e.g., @app vs @)
	// Note: Sorting every call is costly. In a hot path, this should be pre-computed.
	// For now, we maintain behavior but optimized the loop body.
	aliasKeys.sort((a, b) => b.length - a.length);

	for (const aliasKey of aliasKeys) {
		if (filepath.startsWith(aliasKey)) {
			resolved = join(alias[aliasKey]!, filepath.slice(aliasKey.length));
			matchedAlias = true;
			break;
		}
	}

	if (!matchedAlias) {
		const isResolvedAbsolute = /^(?:\/|[a-zA-Z]:\/)/.test(resolved);
		
		if (!isResolvedAbsolute && !isWindowsAbsolute) {
			// Resolve relative to current file or root
			const base = currentFile
				? currentFile.replace(/\\/g, "/").replace(/\/[^/]*$/, "")
				: normalizedRoot;
			resolved = join(base, resolved);
		}
	}

	// Append extension if missing and not a URL (URL check repeated for safety after alias expansion)
	if (
		extension &&
		!/\.[^/.]+$/.test(resolved) &&
		!(resolved.startsWith("http://") || resolved.startsWith("https://"))
	) {
		const ext = extension.charAt(0) === "." ? extension : `.${extension}`;
		resolved += ext;
	}

	// Final normalization to ensure clean forward slashes
	return resolved.replace(/\/+/g, "/");
}
