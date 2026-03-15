import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { Kire } from "kire";
import {
	removeHotFile,
	resolveRuntimePaths,
	writeHotFile,
} from "./manifest";
import type {
	KireVitePluginAssetOptions,
	KireVitePluginOptions,
	KireVitePluginTemplateOptions,
	ViteDevServer,
	VitePlugin,
	ViteResolvedConfig,
	ViteUserConfig,
} from "./types";
import {
	extractGlobBase,
	isGlobPattern,
	matchesRefresh,
	normalizeInput,
	normalizeSlashes,
	toArray,
} from "./utils";

const DEFAULT_ASSET_OPTIONS: Required<
	Pick<KireVitePluginAssetOptions, "publicDirectory" | "buildDirectory">
> = {
	publicDirectory: "public",
	buildDirectory: "build",
};

const DEFAULT_TEMPLATE_ROOT = "views";
const DEFAULT_TEMPLATE_OUTFILE = ".kire.builded.js";

function isTemplateOptions(
	options: KireVitePluginOptions,
): options is KireVitePluginTemplateOptions {
	return (options as KireVitePluginTemplateOptions).kire === true;
}

function resolveDevServerUrl(
	server: ViteDevServer,
	config?: ViteResolvedConfig,
	override?: string,
): string {
	if (override) return override.trim().replace(/\/+$/, "");
	if (config?.server?.origin) {
		return config.server.origin.trim().replace(/\/+$/, "");
	}

	const resolvedUrl =
		server.resolvedUrls?.local?.[0] || server.resolvedUrls?.network?.[0];
	if (resolvedUrl) return resolvedUrl.trim().replace(/\/+$/, "");

	const address = server.httpServer?.address?.();
	const protocol = config?.server?.https ? "https" : "http";
	let host = config?.server?.host;
	if (!host || host === true || host === "0.0.0.0" || host === "::") {
		host = "localhost";
	}
	const port =
		typeof address === "object" && address && "port" in address
			? address.port
			: config?.server?.port || 5173;
	return `${protocol}://${host}:${port}`;
}

function createAssetPlugin(options: KireVitePluginAssetOptions): VitePlugin {
	let command = "serve";
	let resolvedConfig: ViteResolvedConfig | undefined;
	let activePaths = resolveRuntimePaths(options);
	const refresh = options.refresh ?? true;

	return {
		name: "@kirejs/vite:assets",
		enforce: "pre",
		config(config, env) {
			command = env.command;
			const cwd = config.root ? path.resolve(config.root) : process.cwd();

			const runtime = resolveRuntimePaths({
				...DEFAULT_ASSET_OPTIONS,
				...options,
				cwd,
			});
			activePaths = runtime;

			const next: ViteUserConfig = {
				build: {},
			};

			if (config.build?.manifest === undefined) {
				next.build!.manifest = "manifest.json";
			}

			if (config.build?.outDir === undefined) {
				next.build!.outDir = runtime.outDir;
			}

			if (config.build?.emptyOutDir === undefined) {
				next.build!.emptyOutDir = true;
			}

			const input = normalizeInput(options.input);
			if (input.length > 0 && config.build?.rollupOptions?.input === undefined) {
				next.build!.rollupOptions = {
					input,
				};
			}

			return next;
		},
		configResolved(config) {
			resolvedConfig = config;
			activePaths = resolveRuntimePaths({
				...DEFAULT_ASSET_OPTIONS,
				...options,
				cwd: config.root,
			});
		},
		buildStart() {
			if (command === "build") {
				removeHotFile(activePaths.hotFilePath);
			}
		},
		configureServer(server) {
			const write = () => {
				const devServerUrl = resolveDevServerUrl(
					server,
					resolvedConfig,
					options.devServerUrl,
				);
				writeHotFile(activePaths.hotFilePath, devServerUrl);
			};

			if (server.httpServer) {
				server.httpServer.once("listening", write);
			} else {
				write();
			}

			return () => {
				removeHotFile(activePaths.hotFilePath);
			};
		},
		handleHotUpdate(ctx) {
			const root = resolvedConfig?.root || process.cwd();
			if (!matchesRefresh(ctx.file, refresh, root)) return;
			ctx.server.ws.send({ type: "full-reload", path: "*" });
		},
	};
}

function normalizeNamespaceDirectory(source: string): string {
	const normalized = normalizeSlashes(source).trim();
	if (!normalized) return ".";
	if (isGlobPattern(normalized)) return extractGlobBase(normalized);
	if (normalized.endsWith(".kire")) {
		const dir = path.posix.dirname(normalized);
		return dir && dir !== "." ? dir : ".";
	}
	return normalized;
}

function resolveDirectory(
	value: string,
	projectRoot: string,
	kireRoot: string,
): string {
	if (path.isAbsolute(value)) return normalizeSlashes(value);

	const rootCandidate = path.resolve(kireRoot, value);
	if (existsSync(rootCandidate)) return normalizeSlashes(rootCandidate);

	const projectCandidate = path.resolve(projectRoot, value);
	return normalizeSlashes(projectCandidate);
}

function resolveTemplateTargets(
	options: KireVitePluginTemplateOptions,
	projectRoot: string,
	kireRoot: string,
): {
	directories: string[];
	namespaceRoots: Record<string, string>;
} {
	const directories = new Set<string>();
	const namespaceRoots: Record<string, string> = Object.create(null);

	for (const explicit of options.directories || []) {
		directories.add(resolveDirectory(explicit, projectRoot, kireRoot));
	}

	for (const [name, source] of Object.entries(options.namespaces || {})) {
		const values = toArray(source);
		for (const value of values) {
			const namespaceDir = normalizeNamespaceDirectory(String(value));
			const absolute = resolveDirectory(namespaceDir, projectRoot, kireRoot);
			directories.add(absolute);
			if (!namespaceRoots[name]) {
				namespaceRoots[name] = absolute;
			}
		}
	}

	if (!directories.size) {
		directories.add(normalizeSlashes(kireRoot));
	}

	return {
		directories: Array.from(directories),
		namespaceRoots,
	};
}

function compileKireTemplates(
	options: KireVitePluginTemplateOptions,
	projectRoot: string,
) {
	const kireRoot = path.resolve(projectRoot, options.root || DEFAULT_TEMPLATE_ROOT);
	const outfile = path.resolve(
		projectRoot,
		options.outfile || DEFAULT_TEMPLATE_OUTFILE,
	);
	const targets = resolveTemplateTargets(options, projectRoot, kireRoot);

	const kire = new Kire({
		root: kireRoot,
		production: true,
		silent: true,
	});

	for (const [name, namespaceRoot] of Object.entries(targets.namespaceRoots)) {
		kire.namespace(name, namespaceRoot);
	}

	mkdirSync(path.dirname(outfile), { recursive: true });
	kire.compileAndBuild(targets.directories, outfile);
}

function createTemplatePlugin(options: KireVitePluginTemplateOptions): VitePlugin {
	let resolvedConfig: ViteResolvedConfig | undefined;
	let running = false;
	let rerun = false;

	const queueCompile = async (throwOnError: boolean) => {
		if (running) {
			rerun = true;
			return;
		}

		running = true;
		try {
			do {
				rerun = false;
				try {
					const projectRoot = resolvedConfig?.root || process.cwd();
					compileKireTemplates(options, projectRoot);
				} catch (error) {
					if (throwOnError) throw error;
					console.error("[@kirejs/vite] Failed to compile .kire bundle:", error);
				}
			} while (rerun);
		} finally {
			running = false;
		}
	};

	const shouldReload = (file: string): boolean => {
		const root = resolvedConfig?.root || process.cwd();
		return matchesRefresh(file, options.refresh ?? true, root);
	};

	const isKireFile = (file: string): boolean => file.endsWith(".kire");

	return {
		name: "@kirejs/vite:kire",
		configResolved(config) {
			resolvedConfig = config;
		},
		async buildStart() {
			await queueCompile(true);
		},
		configureServer(server) {
			void queueCompile(false);

			const onAddOrUnlink = (file: string) => {
				if (!isKireFile(file)) return;
				void queueCompile(false);
				if (shouldReload(file)) {
					server.ws.send({ type: "full-reload", path: "*" });
				}
			};

			server.watcher.on("add", onAddOrUnlink);
			server.watcher.on("unlink", onAddOrUnlink);

			return () => {
				server.watcher.off?.("add", onAddOrUnlink);
				server.watcher.off?.("unlink", onAddOrUnlink);
			};
		},
		handleHotUpdate(ctx) {
			if (!isKireFile(ctx.file)) return;
			void queueCompile(false);
			if (shouldReload(ctx.file)) {
				ctx.server.ws.send({ type: "full-reload", path: "*" });
			}
		},
	};
}

export function kireVite(options: KireVitePluginOptions = {}): VitePlugin {
	if (isTemplateOptions(options)) return createTemplatePlugin(options);
	return createAssetPlugin(options as KireVitePluginAssetOptions);
}

export default kireVite;
