import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);

/**
 * Loads CSS stylesheets for Tailwind processing
 */
export async function loadStylesheet(id: string, base: string) {
	// Handle tailwindcss core stylesheet
	if (id === "tailwindcss") {
		try {
			const path = require.resolve("tailwindcss/index.css");
			const content = await readFile(path, "utf-8");
			return { base: dirname(path), content, path };
		} catch (e) {
			console.error("Failed to resolve tailwindcss/index.css", e);
		}
	}

	// Resolve other imports (relative paths or node_modules)
	try {
		const path = require.resolve(id, { paths: [base] });
		const content = await readFile(path, "utf-8");
		return { base: dirname(path), content, path };
	} catch (_e) {
		// Silently ignore resolution errors for other files
		return { base, content: "", path: "" };
	}
}

/**
 * Helper to extract the default export from a module
 */
function getModuleExport(module: any) {
	if (module && typeof module === "object" && "default" in module) {
		return module.default;
	}
	return module;
}

/**
 * Loads JavaScript modules for Tailwind configuration
 */
export async function loadModule(id: string, base: string) {
	const baseRequire = createRequire(resolve(base, "index.js"));
	try {
		// Try direct require first (CJS) - this preserves context better for peer deps
		// in some package managers (like Bun/PNPM) compared to resolving path first.
		const mod = baseRequire(id);
		return {
			path: baseRequire.resolve(id),
			base,
			module: getModuleExport(mod),
		};
	} catch (e: any) {
		// If it's an ESM module, require() will fail. Use import() instead.
		if (e.code === "ERR_REQUIRE_ESM") {
			const resolvedPath = baseRequire.resolve(id);
			const module = await import(resolvedPath);
			return {
				path: resolvedPath,
				base: dirname(resolvedPath),
				module: getModuleExport(module),
			};
		}

		// Fallback: Manual resolution via package.json
		// This helps when require(id) fails for other reasons or custom entry point logic is needed
		try {
			// Try to resolve package.json to find the correct entry point
			try {
				const pkgJsonPath = require.resolve(`${id}/package.json`, {
					paths: [base],
				});
				const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
				const main = pkgJson.main || pkgJson.module || "index.js";
				const entryPath = join(dirname(pkgJsonPath), main);
				const module = await import(entryPath);
				return {
					path: entryPath,
					base: dirname(entryPath),
					module: getModuleExport(module),
				};
			} catch {
				// Final fallback to standard resolution if package.json resolution fails
				const resolvedPath = require.resolve(id, { paths: [base] });
				const module = await import(resolvedPath);
				return {
					path: resolvedPath,
					base: dirname(resolvedPath),
					module: getModuleExport(module),
				};
			}
		} catch (loadError) {
			console.error(`Failed to load module "${id}" from "${base}"`, loadError);
			throw loadError;
		}
	}
}
