import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import type { KireAsset } from "@kirejs/assets";
import { glob } from "glob";
import { colors, Logger } from "./logger";
import { activeKire, type BuildOptions, type SsgBuilder } from "./types";
import { getFiles, getSsgState } from "./utils";

export async function build(opts: BuildOptions) {
	const kireInstance = activeKire;
	if (!kireInstance)
		throw new Error(
			"KireSsg plugin not registered or Kire instance not ready.",
		);

	const state = getSsgState(kireInstance);
	const pluginOptions = state.options;
	const dynamicRoutesMap = state.dynamicRoutesMap;

	const outDir = resolve(opts.out);
	// Fallback to process.cwd() since kire.root property was removed
	const rootDir = process.cwd();
	const routesDir = resolve(rootDir, pluginOptions.routes || ".");
	const assetsPrefix = pluginOptions.assetsPrefix || "_kire";

	Logger.info(
		`Building from ${colors.brightWhite}${routesDir}${colors.reset} to ${colors.brightWhite}${outDir}${colors.reset}...`,
	);

	await mkdir(outDir, { recursive: true });

	// Copy public folder
	if (pluginOptions.public) {
		const publicDir = resolve(rootDir, pluginOptions.public);
		try {
			const cp = async (src: string, dest: string) => {
				const stats = await import("node:fs/promises").then((fs) =>
					fs.stat(src),
				);
				if (stats.isDirectory()) {
					await mkdir(dest, { recursive: true });
					const entries = await readdir(src);
					for (const entry of entries) {
						await cp(join(src, entry), join(dest, entry));
					}
				} else {
					await import("node:fs/promises").then((fs) => fs.copyFile(src, dest));
				}
			};
			await cp(publicDir, outDir);
			Logger.success(`Public assets copied from ${pluginOptions.public}`);
		} catch (e) {
			Logger.warn(`Could not copy public directory: ${e}`);
		}
	}

	const allFiles = await getFiles(routesDir);
	const ext = kireInstance.extension.startsWith(".")
		? kireInstance.extension
		: `.${kireInstance.extension}`;

	const templateFiles = allFiles.filter((f) => f.endsWith(ext));
	const generatedRoutes: string[] = [];

	for (const file of templateFiles) {
		const relativePath = relative(routesDir, file);
		if (relativePath.split("/").some((p) => p.startsWith("_"))) continue;

		// Use relative path from root for view resolution if possible, or relative to routesDir?
		// Since we want to use the kire.view which might expect a namespaced path or relative path.
		// If we pass a relative path to view(), it might try to resolve it against CWD or namespaces.
		// For SSG, we are iterating files on disk. We should probably construct a path that Kire can resolve.
		// If we assume standard kire setup, maybe we should mount the routesDir?
		// For now, let's try using the relative path from rootDir which effectively is CWD relative.
		const kireResolvePath = relative(rootDir, file);
		const hasParamInName =
			relativePath.includes("[") && relativePath.includes("]");

		try {
			state.fileAccessHistory.length = 0;
			state.routeCompilationChain.clear();

			// Initial Render
			const html = await kireInstance.view(kireResolvePath, {
				currentPath: "",
				$params: {},
			});
			const declaredRoutes = dynamicRoutesMap.get(kireResolvePath);

			if (hasParamInName) {
				if (declaredRoutes && Array.isArray(declaredRoutes)) {
					const match = relativePath.match(/\[([^\]]+)\]/);
					const paramName = match ? match[1] : null;

					if (paramName) {
						for (const item of declaredRoutes) {
							let paramValue =
								typeof item === "object"
									? item[paramName] || item.name || item.id || item.package
									: item;
							if (!paramValue) continue;

							if (paramName === "package" && typeof paramValue === "string") {
								paramValue = paramValue.replace("@kirejs/", "");
							}

							const params = { [paramName]: paramValue };
							const pageHtml = await kireInstance.view(kireResolvePath, {
								$params: params,
							});

							const nameWithoutExt = relativePath.slice(0, -ext.length);
							const baseRoute = nameWithoutExt
								.replace(`.[${paramName}]`, "")
								.replace(`[${paramName}]`, "");
							const htmlOutPath = join(baseRoute, paramValue, "index.html");
							const outPath = join(outDir, htmlOutPath);

							await mkdir(dirname(outPath), { recursive: true });
							await writeFile(outPath, pageHtml);

							generatedRoutes.push(
								`/${join(baseRoute, paramValue).replace(/\\/g, "/")}`,
							);
							Logger.build(htmlOutPath, "gen");
						}
					}
				} else {
					Logger.warn(
						`Dynamic template ${relativePath} did not declare routes via @dynamicroutes.`,
					);
				}
				continue;
			}

			const markerRegex = /<!-- KIRE_GEN:(.*?) -->/;
			const match = html.match(markerRegex);

			if (match) {
				const globPattern = match[1];
				Logger.info(
					`Detected Generator in ${relativePath} for '${globPattern}'`,
				);
				const mdFiles = await glob(globPattern!, { cwd: routesDir });

				for (const mdFile of mdFiles) {
					const mdRelative = String(mdFile);
					const pageHtml = await kireInstance.view(kireResolvePath, {
						currentPath: mdRelative,
					});
					const finalHtml = pageHtml.replace(match[0], "");
					const cleanName = mdRelative.replace(/\.(md|markdown)$/, "");
					const htmlOutPath = join(cleanName, "index.html");
					const fullOutPath = join(outDir, htmlOutPath);

					await mkdir(dirname(fullOutPath), { recursive: true });
					await writeFile(fullOutPath, finalHtml);

					generatedRoutes.push(`/${cleanName}`);
					Logger.build(htmlOutPath, "gen");
				}
			} else {
				let htmlOutPath = "";
				const nameWithoutExt = relativePath.slice(0, -ext.length);

				if (nameWithoutExt === "index" || nameWithoutExt.endsWith("/index")) {
					htmlOutPath = `${nameWithoutExt}.html`;
				} else {
					htmlOutPath = join(nameWithoutExt, "index.html");
				}

				const outPath = join(outDir, htmlOutPath);
				await mkdir(dirname(outPath), { recursive: true });
				await writeFile(outPath, html);

				const routeUrl = htmlOutPath
					.replace(/\/index\.html$/, "")
					.replace(/\.html$/, "");
				generatedRoutes.push(routeUrl === "index" ? "/" : `/${routeUrl}`);

				Logger.build(htmlOutPath, "page");
			}
		} catch (e: any) {
			Logger.error(`Failed to render ${relativePath}: ${e.message}`);
		}
	}

	const assetsCache = kireInstance.cached<KireAsset>("@kirejs/assets");
	const entries = Array.from(assetsCache.entries());

	if (entries.length > 0) {
		const assetsDir = join(outDir, assetsPrefix);
		await mkdir(assetsDir, { recursive: true });

		for (const [hash, asset] of entries) {
			const filename = `${hash}.${asset.type === "css" ? "css" : asset.type === "mjs" ? "mjs" : "js"}`;
			await writeFile(join(assetsDir, filename), asset.content);
			Logger.build(`${assetsPrefix}/${filename}`, "asset");
		}
	}

	if (pluginOptions.poshandler) {
		Logger.info("Running post-build handler...");

		const builder: SsgBuilder = {
			routes: generatedRoutes,
			add: async (path: string, content: string) => {
				const fullPath = join(outDir, path);
				await mkdir(dirname(fullPath), { recursive: true });
				await writeFile(fullPath, content);
				Logger.success(`Added: ${path}`);
			},
			rem: async (path: string) => {
				const fullPath = join(outDir, path);
				try {
					await import("node:fs/promises").then((fs) =>
						fs.rm(fullPath, { force: true, recursive: true }),
					);
					Logger.info(`Removed: ${path}`);
				} catch (e) {
					Logger.warn(`Failed to remove ${path}: ${e}`);
				}
			},
		};

		await pluginOptions.poshandler(builder);
	}

	Logger.success("Build complete.");
}
