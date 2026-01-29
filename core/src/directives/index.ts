import type { KireContext, KirePlugin } from "../types";
import { md5 } from "../utils/md5";
import { resolvePath } from "../utils/resolve";
import componentDirectives from "./component";
import importDirectives from "./import";
import defineDirectives from "./layout";
import nativeDirectives from "./natives";

export const KireDirectives: KirePlugin = {
	name: "@kirejs/core",
	sort: 100,
	options: {},
	load(kire) {
		// Register internal helpers
		// add md5 function
		kire.$ctx(
			"$require",
			async function (
				this: KireContext,
				path: string,
				locals: Record<string, any> = {},
				controller?: ReadableStreamDefaultController,
			) {
				const currentKire = this?.$kire || kire;

				// Use absolute path for caching key to avoid conflicts
				const resolvedPath = currentKire.resolvePath(
					path,
					locals,
					currentKire.$extension,
				);

				const cached = currentKire.cached("@kirejs/core");
				const isProd = currentKire.production;
				const cachedHash = cached.get(`md5:${resolvedPath}`);
				let compiledFn: Function | undefined = cached.get(`js:${resolvedPath}`);
				let sourceMap: any = cached.get(`map:${resolvedPath}`);
				let content = "";

				if (!cachedHash || !compiledFn || !isProd) {
					try {
						content = await currentKire.$resolver(resolvedPath);
					} catch (e: any) {
						if (!e.message.includes("No resolver")) {
							console.warn(`Failed to resolve path: ${resolvedPath}`, e);
						}
						return null; // Retorna null se não encontrar, para a diretiva lidar
					}

					if (!content) {
						return null;
					}

					const newHash = md5(content);

					if (cachedHash === newHash && compiledFn) {
						// Optimization: Content hasn't changed, reuse cached function
					} else {
						compiledFn = await currentKire.compileFn(content, resolvedPath);
						sourceMap = (compiledFn as any)._map;

						cached.set(`md5:${resolvedPath}`, newHash);
						cached.set(`js:${resolvedPath}`, compiledFn); // Cache a função compilada
						if (sourceMap) {
							cached.set(`map:${resolvedPath}`, sourceMap);
						}
					}
				}

				if (!compiledFn) return null; // Retorna null se a função não foi compilada/cacheada

				if (sourceMap && !(compiledFn as any)._map) {
					(compiledFn as any)._map = sourceMap;
				}

				// Executa a função compilada com os locals e retorna o HTML
				// We need to cast kire to any or make run public to access it from here since it was private
				return (currentKire as any).run(compiledFn, locals, true, controller);
			},
		);

		defineDirectives(kire);
		nativeDirectives(kire);
		importDirectives(kire);
		componentDirectives(kire);
	},
};

function _escapeHtml(unsafe: any): string {
	if (unsafe === null || unsafe === undefined) return "";
	return String(unsafe)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
