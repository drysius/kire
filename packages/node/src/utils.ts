import { readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Normalizes a path to use forward slashes.
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, "/");
}

/**
 * Recursively walks a directory and returns files matching the regex.
 * Used by Node and Deno adapters (via polyfill or direct FS access).
 */
export async function recursiveReaddir(
	dir: string,
	pattern: RegExp,
): Promise<string[]> {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		const files: string[] = [];

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);
			const normalizedPath = normalizePath(fullPath);

			if (entry.isDirectory()) {
				files.push(...(await recursiveReaddir(fullPath, pattern)));
			} else {
				// Check pattern against file name OR full relative path
				if (pattern.test(entry.name) || pattern.test(normalizedPath)) {
					files.push(normalizedPath);
				}
			}
		}
		return files;
	} catch (e) {
		// If directory doesn't exist or permission denied, just return empty to be safe
		return [];
	}
}

/**
 * Converts a simplified glob string to a RegExp.
 */
export function globToRegex(glob: string): RegExp {
	// Escape all regex special characters except * and { } which are part of our simple glob syntax
	// We handle * and ** separately after escaping others
	let regex = glob.replace(/[-/\\^$+?.()|[\]]/g, "\\$&");

	regex = regex
		.replace(/\*\*/g, ".*") // ** -> match anything
		.replace(/\*/g, "[^/]*") // * -> match anything except separator
		.replace(/\{([^}]+)\}/g, "($1)") // {a,b} -> (a,b) (temp)
		.replace(/,/g, "|"); // Comma inside braces becomes OR

	return new RegExp(`^${regex}$`);
}

/**
 * Helper to fetch a file from a URL.
 */
export async function fetchFile(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
	}
	return await res.text();
}
