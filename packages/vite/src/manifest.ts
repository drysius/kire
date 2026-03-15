import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import type {
	KireViteInput,
	KireViteRenderOptions,
	ViteManifest,
} from "./types";
import {
	isCssFile,
	isImageFile,
	isJsFile,
	normalizeEntry,
	normalizeSlashes,
	trimSlashes,
	unique,
} from "./utils";

interface RuntimePaths {
	cwd: string;
	buildDirectory: string;
	manifestPath: string;
	hotFilePath: string;
	outDir: string;
}

interface ManifestCacheEntry {
	mtimeMs: number;
	data: ViteManifest;
}

const DEFAULT_PUBLIC_DIRECTORY = "public";
const DEFAULT_BUILD_DIRECTORY = "build";
const DEFAULT_MANIFEST_FILENAME = "manifest.json";

const manifestCache = new Map<string, ManifestCacheEntry>();

export function resolveRuntimePaths(options: KireViteRenderOptions = {}): RuntimePaths {
	const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
	const publicDirectory = options.publicDirectory || DEFAULT_PUBLIC_DIRECTORY;
	const buildDirectory = trimSlashes(options.buildDirectory || DEFAULT_BUILD_DIRECTORY);
	const manifestFilename = options.manifestFilename || DEFAULT_MANIFEST_FILENAME;

	const publicPath = path.resolve(cwd, publicDirectory);
	const outDir = buildDirectory ? path.join(publicPath, buildDirectory) : publicPath;
	const manifestPath = path.join(outDir, manifestFilename);
	const hotFilePath = options.hotFile
		? path.resolve(cwd, options.hotFile)
		: path.join(publicPath, "hot");

	return {
		cwd,
		buildDirectory,
		manifestPath,
		hotFilePath,
		outDir,
	};
}

export function readHotServerUrl(options: KireViteRenderOptions = {}): string | null {
	if (options.devServerUrl) {
		return options.devServerUrl.trim().replace(/\/+$/, "");
	}

	const { hotFilePath } = resolveRuntimePaths(options);
	if (!existsSync(hotFilePath)) return null;
	const raw = readFileSync(hotFilePath, "utf8").trim();
	return raw ? raw.replace(/\/+$/, "") : null;
}

export function writeHotFile(hotFilePath: string, devServerUrl: string): void {
	const url = devServerUrl.trim().replace(/\/+$/, "");
	mkdirSync(path.dirname(hotFilePath), { recursive: true });
	writeFileSync(hotFilePath, url, "utf8");
}

export function removeHotFile(hotFilePath: string): void {
	if (!existsSync(hotFilePath)) return;
	rmSync(hotFilePath, { force: true });
}

function readManifest(manifestPath: string): ViteManifest {
	const absolute = path.resolve(manifestPath);
	const stats = statSync(absolute);
	const cached = manifestCache.get(absolute);

	if (cached && cached.mtimeMs === stats.mtimeMs) {
		return cached.data;
	}

	const content = readFileSync(absolute, "utf8");
	const parsed = JSON.parse(content) as ViteManifest;
	manifestCache.set(absolute, { mtimeMs: stats.mtimeMs, data: parsed });
	return parsed;
}

function normalizeEntries(
	entries: unknown,
	fallback?: KireViteInput,
): string[] {
	const source = entries === undefined ? fallback : entries;
	if (source === undefined || source === null) return [];

	const flattened: string[] = [];
	const walk = (value: unknown) => {
		if (value === undefined || value === null) return;
		if (Array.isArray(value)) {
			for (const item of value) walk(item);
			return;
		}
		if (typeof value === "string") {
			const entry = normalizeEntry(value);
			if (entry) flattened.push(entry);
		}
	};

	walk(source);
	return unique(flattened);
}

function findManifestEntry(
	manifest: ViteManifest,
	entry: string,
): string | undefined {
	const normalized = normalizeEntry(entry);
	const variants = unique([
		normalized,
		normalized.replace(/^\//, ""),
		`./${normalized}`.replace(/^\.\//, ""),
	]);

	for (const variant of variants) {
		if (manifest[variant]) return variant;
	}

	for (const [key, chunk] of Object.entries(manifest)) {
		const normalizedKey = normalizeEntry(key);
		const normalizedSource = chunk.src ? normalizeEntry(chunk.src) : "";
		if (variants.includes(normalizedKey) || variants.includes(normalizedSource)) {
			return key;
		}
	}

	return undefined;
}

interface CollectedManifestAssets {
	styles: Set<string>;
	scripts: Set<string>;
	modulePreloads: Set<string>;
	visited: Set<string>;
}

function collectChunk(
	manifest: ViteManifest,
	key: string,
	bucket: CollectedManifestAssets,
	isRoot = false,
): void {
	if (bucket.visited.has(key)) return;
	bucket.visited.add(key);

	const chunk = manifest[key];
	if (!chunk) return;

	for (const imported of chunk.imports || []) {
		collectChunk(manifest, imported, bucket, false);
	}

	for (const imported of chunk.dynamicImports || []) {
		collectChunk(manifest, imported, bucket, false);
	}

	for (const cssFile of chunk.css || []) {
		bucket.styles.add(cssFile);
	}

	if (chunk.file) {
		if (isCssFile(chunk.file)) {
			bucket.styles.add(chunk.file);
		} else if (isRoot) {
			bucket.scripts.add(chunk.file);
		} else {
			bucket.modulePreloads.add(chunk.file);
		}
	}
}

function toPublicUrl(
	file: string,
	buildDirectory: string,
	assetUrl?: string,
): string {
	const normalizedFile = normalizeEntry(file);
	const normalizedBuild = trimSlashes(buildDirectory);
	const joined = normalizedBuild ? `${normalizedBuild}/${normalizedFile}` : normalizedFile;
	if (assetUrl) {
		return `${assetUrl.replace(/\/+$/, "")}/${joined}`;
	}
	return `/${joined}`;
}

function renderDevTags(devServerUrl: string, entries: string[]): string {
	const base = devServerUrl.replace(/\/+$/, "");
	const tags: string[] = [
		`<script type="module" src="${base}/@vite/client"></script>`,
	];

	for (const entry of entries) {
		const src = `${base}/${entry}`;
		if (isCssFile(entry)) {
			tags.push(`<link rel="stylesheet" href="${src}" />`);
			continue;
		}
		if (isImageFile(entry)) {
			tags.push(`<link rel="preload" as="image" href="${src}" />`);
			continue;
		}
		if (isJsFile(entry) || !path.extname(entry)) {
			tags.push(`<script type="module" src="${src}"></script>`);
			continue;
		}
		tags.push(`<link rel="preload" href="${src}" />`);
	}

	return tags.join("\n");
}

function renderManifestTags(
	manifest: ViteManifest,
	entries: string[],
	options: KireViteRenderOptions,
	manifestPath: string,
	buildDirectory: string,
): string {
	const throwOnMissingEntry = options.throwOnMissingEntry ?? true;
	const bucket: CollectedManifestAssets = {
		styles: new Set(),
		scripts: new Set(),
		modulePreloads: new Set(),
		visited: new Set(),
	};
	const comments: string[] = [];

	for (const entry of entries) {
		const manifestKey = findManifestEntry(manifest, entry);
		if (!manifestKey) {
			if (throwOnMissingEntry) {
				throw new Error(
					`[kire-vite] Entry "${entry}" not found in manifest: ${manifestPath}`,
				);
			}
			comments.push(`<!-- kire-vite: missing "${entry}" -->`);
			continue;
		}
		collectChunk(manifest, manifestKey, bucket, true);
	}

	const tags: string[] = [];
	for (const style of bucket.styles) {
		tags.push(
			`<link rel="stylesheet" href="${toPublicUrl(style, buildDirectory, options.assetUrl)}" />`,
		);
	}

	for (const preload of bucket.modulePreloads) {
		tags.push(
			`<link rel="modulepreload" href="${toPublicUrl(preload, buildDirectory, options.assetUrl)}" />`,
		);
	}

	for (const script of bucket.scripts) {
		tags.push(
			`<script type="module" src="${toPublicUrl(script, buildDirectory, options.assetUrl)}"></script>`,
		);
	}

	return [...comments, ...tags].join("\n");
}

export function renderViteTags(
	entries?: unknown,
	options: KireViteRenderOptions = {},
): string {
	const runtimePaths = resolveRuntimePaths(options);
	const resolvedEntries = normalizeEntries(entries, options.input);
	if (!resolvedEntries.length) return "";

	const devServerUrl = readHotServerUrl(options);
	if (devServerUrl) {
		return renderDevTags(devServerUrl, resolvedEntries);
	}

	if (!existsSync(runtimePaths.manifestPath)) {
		throw new Error(
			`[kire-vite] Manifest not found: ${normalizeSlashes(runtimePaths.manifestPath)}`,
		);
	}

	const manifest = readManifest(runtimePaths.manifestPath);
	return renderManifestTags(
		manifest,
		resolvedEntries,
		options,
		runtimePaths.manifestPath,
		runtimePaths.buildDirectory,
	);
}

export type { ViteManifest };
