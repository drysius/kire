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
	// Escape special regex characters except for glob wildcards (*, {, }, comma)
    // We treat everything else as literal
	let regex = glob.replace(/[.+^${}()|[\\]/g, "\\$& ");
    
	// Convert glob patterns to regex
    // ** -> .*
	regex = regex.replace(/\\*\\*/g, ".*");
    // * -> [^/]* (single path segment)
	regex = regex.replace(/(?<!\\.)\\*/g, "[^/]*");
    
    // Restore braces logic if needed, but simple glob usually just needs escaping dots and converting stars.
    // If we support {a,b}, we need to unescape the braces we just escaped.
    
    // Handle {a,b} group matching
    // First, verify if the user intended matching groups.
    // The previous implementation was:
    // regex = regex.replace(/\{([^}]+)\}/g, "($1)");
    // regex = regex.replace(/\(([^)]+)\)/g, (_, group) => group.replace(/,/g, "|"));
    
    // Since we escaped { and }, we look for \\{ ... \\
    regex = regex.replace(/\\\{([^}]+)\\\}/g, (_, content) => {
        // content inside braces might contain commas which are currently literal ','
        // we want to convert them to OR pipes '|'
        const group = content.replace(/,/g, "|");
        return `(${group})`;
    });

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