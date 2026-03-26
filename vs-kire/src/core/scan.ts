import { statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import * as vscode from "vscode";
import { kireLog } from "./log";
import { type PackageMetadata, kireStore } from "./store";

const runtimeRequire = createRequire(import.meta.url);

type KireCtor = new (options?: any) => any;

function tryLoadKireFromBase(basePath: string): KireCtor | null {
	try {
		const requireFromBase = createRequire(basePath);
		const mod = requireFromBase("kire") as { Kire?: KireCtor };
		if (typeof mod?.Kire === "function") {
			return mod.Kire;
		}
	} catch {}
	return null;
}

async function tryLoadBundledKire(): Promise<KireCtor | null> {
	try {
		const bundledUrl = new URL("./kire-runtime.js", import.meta.url);
		const mod = await import(bundledUrl.href);
		if (typeof mod?.Kire === "function") {
			return mod.Kire as KireCtor;
		}
	} catch (error) {
		kireLog(
			"warn",
			`Unable to load bundled Kire runtime: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
	return null;
}

async function resolveKireConstructor(): Promise<KireCtor> {
	const folders = vscode.workspace.workspaceFolders || [];
	for (const folder of folders) {
		const kireCtor = tryLoadKireFromBase(
			join(folder.uri.fsPath, "package.json"),
		);
		if (kireCtor) {
			kireLog(
				"debug",
				`Using workspace Kire runtime from ${folder.uri.fsPath}`,
			);
			return kireCtor;
		}
	}

	const fallback =
		tryLoadKireFromBase(import.meta.url) ||
		tryLoadKireFromBase(join(process.cwd(), "package.json"));
	if (fallback) {
		kireLog("debug", "Using fallback Kire runtime resolved from process base.");
		return fallback;
	}

	const bundledKire = await tryLoadBundledKire();
	if (bundledKire) {
		kireLog("warn", "Using bundled Kire runtime fallback.");
		return bundledKire;
	}

	throw new Error("Unable to resolve the Kire runtime for schema loading.");
}

interface KireSchemaDefinition {
	name?: string;
	version?: string;
	description?: string;
	author?: string;
	repository?: string | { url?: string };
	dependencies?: string[];
	directives?: any[];
	elements?: any[];
	attributes?: any[] | Record<string, any>;
	types?: any[];
	tools?: Record<string, any>;
	handle?: (kire: any) => void | Promise<void>;
}

interface KireSchemaShape {
	name?: string;
	version?: string;
	description?: string;
	author?: string;
	repository?: string;
	dependencies?: string[];
	directives?: any[];
	elements?: any[];
	attributes?: any[];
	types?: any[];
	tools?: Record<string, any>;
}

function createEmptySchema(): KireSchemaShape {
	return {
		dependencies: [],
		directives: [],
		elements: [],
		attributes: [],
		types: [],
		tools: {},
	};
}

function safeResolveRepository(repository: any): string | undefined {
	if (!repository) return undefined;
	if (typeof repository === "string") return repository;
	if (typeof repository === "object") return repository.url;
	return String(repository);
}

function getPackageMetadata(source: {
	name?: string;
	version?: string;
	description?: string;
	author?: string;
	repository?: string | { url?: string };
}): PackageMetadata {
	return {
		name: typeof source.name === "string" ? source.name : undefined,
		version: typeof source.version === "string" ? source.version : undefined,
		description:
			typeof source.description === "string" ? source.description : undefined,
		author: typeof source.author === "string" ? source.author : undefined,
		repository: safeResolveRepository(source.repository),
	};
}

function annotateDefinitionPackage<T>(value: T, pkg: PackageMetadata): T {
	if (!value || typeof value !== "object") return value;
	if (Array.isArray(value)) {
		return value.map((entry) => annotateDefinitionPackage(entry, pkg)) as T;
	}

	const next = {
		...(value as Record<string, any>),
		package: { ...pkg },
	} as Record<string, any>;

	if (next.extends) {
		next.extends = annotateDefinitionPackage(next.extends, pkg);
	}

	return next as T;
}

function annotateElementAttributes(
	attributes: any[] | Record<string, any> | undefined,
	pkg: PackageMetadata,
) {
	if (!attributes) return attributes;
	if (Array.isArray(attributes)) {
		return attributes.map((entry) => annotateDefinitionPackage(entry, pkg));
	}
	if (typeof attributes !== "object") return attributes;
	return Object.fromEntries(
		Object.entries(attributes).map(([name, value]) => {
			if (!value || typeof value !== "object") return [name, value];
			return [name, annotateDefinitionPackage(value, pkg)];
		}),
	);
}

function annotateSchemaPackage(
	schema: KireSchemaShape,
	pkg: PackageMetadata,
): KireSchemaShape {
	return {
		...schema,
		directives: Array.isArray(schema.directives)
			? schema.directives.map((entry) => annotateDefinitionPackage(entry, pkg))
			: [],
		elements: Array.isArray(schema.elements)
			? schema.elements.map((entry) => {
					const annotated = annotateDefinitionPackage(entry, pkg) as Record<
						string,
						any
					>;
					annotated.attributes = annotateElementAttributes(
						annotated.attributes,
						pkg,
					);
					return annotated;
				})
			: [],
		attributes: Array.isArray(schema.attributes)
			? schema.attributes.map((entry) => annotateDefinitionPackage(entry, pkg))
			: [],
		types: Array.isArray(schema.types)
			? schema.types.map((entry) => annotateDefinitionPackage(entry, pkg))
			: [],
		tools:
			schema.tools && typeof schema.tools === "object"
				? annotateDefinitionPackage(schema.tools, pkg)
				: {},
	};
}

function diffNamedList(
	before: any[] | undefined,
	after: any[] | undefined,
	key: "name" | "variable",
) {
	const previous = new Map<string, string>();
	for (const item of before || []) {
		if (!item || typeof item !== "object") continue;
		const name = item[key];
		if (typeof name !== "string") continue;
		previous.set(name, JSON.stringify(item));
	}

	const out: any[] = [];
	for (const item of after || []) {
		if (!item || typeof item !== "object") continue;
		const name = item[key];
		if (typeof name !== "string") {
			out.push(item);
			continue;
		}

		if (previous.get(name) !== JSON.stringify(item)) {
			out.push(item);
		}
	}

	return out;
}

function diffTools(
	before: Record<string, any> | undefined,
	after: Record<string, any> | undefined,
) {
	const out: Record<string, any> = {};
	for (const [name, value] of Object.entries(after || {})) {
		if (JSON.stringify(before?.[name]) !== JSON.stringify(value)) {
			out[name] = value;
		}
	}
	return out;
}

function diffSchema(
	before: KireSchemaShape,
	after: KireSchemaShape,
): KireSchemaShape {
	return {
		dependencies: [],
		directives: diffNamedList(before.directives, after.directives, "name"),
		elements: diffNamedList(before.elements, after.elements, "name"),
		attributes: diffNamedList(before.attributes, after.attributes, "name"),
		types: diffNamedList(before.types, after.types, "variable"),
		tools: diffTools(before.tools, after.tools),
	};
}

function normalizeAttributes(attributes: any): any[] {
	if (!attributes) return [];
	if (Array.isArray(attributes)) return attributes.filter((entry) => !!entry);
	if (typeof attributes !== "object") return [];

	const entries: any[] = [];
	for (const [name, value] of Object.entries(attributes)) {
		if (name === "global" && value && typeof value === "object") {
			for (const [globalName, globalDef] of Object.entries(
				value as Record<string, any>,
			)) {
				if (typeof globalDef === "string") {
					entries.push({ name: globalName, type: globalDef });
				} else if (globalDef && typeof globalDef === "object") {
					entries.push({
						name: globalName,
						...(globalDef as Record<string, any>),
					});
				}
			}
			continue;
		}

		if (typeof value === "string") {
			entries.push({ name, type: value });
			continue;
		}

		if (value && typeof value === "object") {
			entries.push({ name, ...(value as Record<string, any>) });
		}
	}

	return entries;
}

function normalizeTypes(types: any, globals: any): any[] {
	if (Array.isArray(types)) return types.filter((entry) => !!entry);
	if (!globals || typeof globals !== "object") return [];

	const result: any[] = [];
	for (const [variable, raw] of Object.entries(
		globals as Record<string, any>,
	)) {
		if (raw && typeof raw === "object") {
			const node = raw as Record<string, any>;
			result.push({
				variable,
				type: "global",
				tstype: node.tstype || node.type || "any",
				comment: node.comment || node.description,
			});
			continue;
		}

		result.push({
			variable,
			type: "global",
			tstype: typeof raw === "string" ? raw : "any",
		});
	}

	return result;
}

function normalizeSchemaLike(schema: any): KireSchemaShape {
	if (!schema || typeof schema !== "object") return createEmptySchema();

	const repository = safeResolveRepository(schema.repository);
	return {
		name: typeof schema.name === "string" ? schema.name : undefined,
		version: typeof schema.version === "string" ? schema.version : undefined,
		description:
			typeof schema.description === "string" ? schema.description : undefined,
		author: typeof schema.author === "string" ? schema.author : undefined,
		repository,
		dependencies: Array.isArray(schema.dependencies)
			? schema.dependencies.filter((dep: any) => typeof dep === "string")
			: [],
		directives: Array.isArray(schema.directives) ? schema.directives : [],
		elements: Array.isArray(schema.elements) ? schema.elements : [],
		attributes: normalizeAttributes(schema.attributes),
		types: normalizeTypes(schema.types, schema.globals),
		tools:
			schema.tools && typeof schema.tools === "object"
				? (schema.tools as Record<string, any>)
				: {},
	};
}

function normalizeLegacyPkgSchema(legacy: any): KireSchemaShape {
	if (!legacy || typeof legacy !== "object") return createEmptySchema();

	return {
		name: typeof legacy.package === "string" ? legacy.package : undefined,
		version: typeof legacy.version === "string" ? legacy.version : undefined,
		repository: safeResolveRepository(legacy.repository),
		dependencies: Array.isArray(legacy.dependencies)
			? legacy.dependencies.filter((dep: any) => typeof dep === "string")
			: [],
		directives: Array.isArray(legacy.directives) ? legacy.directives : [],
		elements: Array.isArray(legacy.elements) ? legacy.elements : [],
		attributes: normalizeAttributes(legacy.attributes),
		types: normalizeTypes(undefined, legacy.globals),
		tools: {},
	};
}

function mergeNamedList(
	target: any[],
	incoming: any[],
	key: "name" | "variable" = "name",
) {
	const index = new Map<string, number>();
	for (let i = 0; i < target.length; i++) {
		const item = target[i];
		const name = item && typeof item === "object" ? item[key] : undefined;
		if (typeof name === "string" && !index.has(name)) {
			index.set(name, i);
		}
	}

	for (const item of incoming) {
		if (!item || typeof item !== "object") continue;
		const name = item[key];
		if (typeof name !== "string") {
			target.push(item);
			continue;
		}

		const existingIndex = index.get(name);
		if (typeof existingIndex === "number") {
			target[existingIndex] = { ...target[existingIndex], ...item };
			continue;
		}

		index.set(name, target.length);
		target.push(item);
	}
}

function mergeSchema(
	target: KireSchemaShape,
	source: Partial<KireSchemaShape> | undefined | null,
) {
	if (!source) return;

	if (source.name) target.name = source.name;
	if (source.version) target.version = source.version;
	if (source.description) target.description = source.description;
	if (source.author) target.author = source.author;
	if (source.repository) target.repository = source.repository;

	if (Array.isArray(source.dependencies) && source.dependencies.length > 0) {
		const next = new Set<string>(target.dependencies || []);
		for (const dep of source.dependencies) next.add(dep);
		target.dependencies = Array.from(next);
	}

	if (Array.isArray(source.directives) && source.directives.length > 0) {
		if (!Array.isArray(target.directives)) target.directives = [];
		mergeNamedList(target.directives, source.directives, "name");
	}

	if (Array.isArray(source.elements) && source.elements.length > 0) {
		if (!Array.isArray(target.elements)) target.elements = [];
		mergeNamedList(target.elements, source.elements, "name");
	}

	if (Array.isArray(source.attributes) && source.attributes.length > 0) {
		if (!Array.isArray(target.attributes)) target.attributes = [];
		mergeNamedList(target.attributes, source.attributes, "name");
	}

	if (Array.isArray(source.types) && source.types.length > 0) {
		if (!Array.isArray(target.types)) target.types = [];
		mergeNamedList(target.types, source.types, "variable");
	}

	if (source.tools && typeof source.tools === "object") {
		target.tools = {
			...(target.tools || {}),
			...source.tools,
		};
	}
}

function extractEngineSchema(
	engine: any,
	fallbackMeta: { name?: string; repository?: string; version?: string },
): KireSchemaShape {
	if (engine?.$schema && typeof engine.$schema === "object") {
		return normalizeSchemaLike(engine.$schema);
	}

	if (typeof engine?.pkgSchema === "function") {
		try {
			const legacy = engine.pkgSchema(
				fallbackMeta.name || "kire-app",
				fallbackMeta.repository || "",
				fallbackMeta.version || "1.0.0",
			);
			return normalizeLegacyPkgSchema(legacy);
		} catch {}
	}

	return createEmptySchema();
}

async function loadSchemaModule(
	uri: vscode.Uri,
	engine: any,
	collected: KireSchemaShape,
) {
	const state = kireStore.getState();
	try {
		const modulePath = uri.fsPath;
		kireLog("debug", `Loading schema module: ${modulePath}`);
		let mod: any;
		try {
			const resolved = runtimeRequire.resolve(modulePath);
			delete runtimeRequire.cache[resolved];
			mod = runtimeRequire(modulePath);
		} catch (_requireError) {
			const moduleUrl = pathToFileURL(modulePath);
			try {
				const stat = statSync(modulePath);
				moduleUrl.searchParams.set("t", String(Math.floor(stat.mtimeMs)));
			} catch {}
			mod = await import(moduleUrl.href);
		}
		const schema = (mod?.default ?? mod) as
			| Partial<KireSchemaDefinition>
			| undefined;
		if (!schema || typeof schema !== "object") return;
		const packageMeta = getPackageMetadata(schema);

		mergeSchema(
			collected,
			annotateSchemaPackage(normalizeSchemaLike(schema), packageMeta),
		);
		kireLog("debug", `Schema parsed: ${modulePath}`);

		if (
			schema.name ||
			schema.version ||
			schema.author ||
			schema.repository ||
			schema.description
		) {
			state.setMetadata({
				name: schema.name,
				version: schema.version,
				author: schema.author,
				repository: safeResolveRepository(schema.repository),
				description: schema.description,
			});

			if (typeof engine?.kireSchema === "function") {
				try {
					engine.kireSchema({
						name: schema.name,
						version: schema.version,
						description: schema.description,
						author: schema.author,
						repository: safeResolveRepository(schema.repository),
						dependencies: schema.dependencies,
						tools: schema.tools,
					});
				} catch {}
			}
		}

		if (typeof schema.handle === "function") {
			const beforeHandle = extractEngineSchema(engine, packageMeta);
			try {
				await Promise.resolve(schema.handle(engine));
				const afterHandle = extractEngineSchema(engine, packageMeta);
				mergeSchema(
					collected,
					annotateSchemaPackage(diffSchema(beforeHandle, afterHandle), packageMeta),
				);
				kireLog("debug", `Schema handle executed: ${modulePath}`);
			} catch (error) {
				kireLog(
					"warn",
					`Schema handle error (${modulePath}): ${error instanceof Error ? error.message : "Unknown error"}`,
				);
				console.warn(
					`Failed to execute schema handle ${uri.fsPath}:`,
					error instanceof Error ? error.message : "Unknown error",
				);
			}
		}
	} catch (error) {
		kireLog(
			"error",
			`Failed to load schema module (${uri.fsPath}): ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		console.warn(
			`Failed to load schema module ${uri.fsPath}:`,
			error instanceof Error ? error.message : "Unknown error",
		);
	}
}

export async function loadSchemas(): Promise<void> {
	const startedAt = Date.now();
	kireStore.getState().clear();
	kireLog("info", "Starting schema load.");

	const Kire = await resolveKireConstructor();
	const engine = new Kire({
		production: true,
		silent: true,
	});
	kireStore.getState().setEngine(engine);
	const collected = createEmptySchema();
	mergeSchema(
		collected,
		annotateSchemaPackage(
			extractEngineSchema(engine, {
				name: "kire",
				version: "0.0.0",
			}),
			{ name: "kire", version: "0.0.0" },
		),
	);

	if (
		typeof (engine as any).use !== "function" &&
		typeof (engine as any).plugin === "function"
	) {
		(engine as any).use = (plugin: any, opts?: any) =>
			(engine as any).plugin(plugin, opts);
	}

	if (typeof (engine as any).kireSchema !== "function") {
		(engine as any).kireSchema = (partial: any) => {
			mergeSchema(collected, normalizeSchemaLike(partial));
			return engine;
		};
	}

	try {
		const config = vscode.workspace.getConfiguration("kire");
		const scanNodeModules = config.get<boolean>(
			"schema.scanNodeModules",
			false,
		);

		const [moduleWorkspace, moduleNodeModules] = await Promise.all([
			vscode.workspace.findFiles(
				"**/kire.schema.js",
				"**/{node_modules,publish,.git,dist,coverage,test-results,playwright-report}/**",
			),
			scanNodeModules
				? vscode.workspace.findFiles("**/node_modules/**/kire.schema.js")
				: Promise.resolve([] as vscode.Uri[]),
		]);

		const dedupe = (uris: vscode.Uri[]) => {
			const m = new Map<string, vscode.Uri>();
			for (const uri of uris) m.set(uri.toString(), uri);
			return Array.from(m.values());
		};

		const moduleUris = dedupe([...moduleWorkspace, ...moduleNodeModules]);
		kireLog(
			"info",
			`Discovered ${moduleUris.length} schema module(s). workspace=${moduleWorkspace.length}, node_modules=${moduleNodeModules.length}`,
		);

		for (const uri of moduleUris) {
			await loadSchemaModule(uri, engine, collected);
		}

		mergeSchema(
			collected,
			extractEngineSchema(engine, kireStore.getState().metadata),
		);
		kireStore.getState().applyKireSchema(collected as any);
		kireLog(
			"info",
			`Schema load completed in ${Date.now() - startedAt}ms. directives=${collected.directives?.length || 0}, elements=${collected.elements?.length || 0}, attributes=${collected.attributes?.length || 0}, types=${collected.types?.length || 0}`,
		);
	} catch (error) {
		kireLog(
			"error",
			`Error loading schemas: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		console.error("Error loading Kire schemas:", error);
	}
}
