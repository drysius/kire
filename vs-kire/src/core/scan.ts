import * as vscode from "vscode";
import { statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { kireStore } from "./store";
import { kireLog } from "./log";

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

function resolveKireConstructor(): KireCtor {
    const folders = vscode.workspace.workspaceFolders || [];
    for (const folder of folders) {
        const kireCtor = tryLoadKireFromBase(join(folder.uri.fsPath, "package.json"));
        if (kireCtor) {
            kireLog("debug", `Using workspace Kire runtime from ${folder.uri.fsPath}`);
            return kireCtor;
        }
    }

    const fallback = tryLoadKireFromBase(import.meta.url) || tryLoadKireFromBase(join(process.cwd(), "package.json"));
    if (fallback) return fallback;

    const mod = runtimeRequire("kire") as { Kire?: KireCtor };
    if (typeof mod?.Kire === "function") return mod.Kire;

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

function normalizeAttributes(attributes: any): any[] {
    if (!attributes) return [];
    if (Array.isArray(attributes)) return attributes.filter((entry) => !!entry);
    if (typeof attributes !== "object") return [];

    const entries: any[] = [];
    for (const [name, value] of Object.entries(attributes)) {
        if (name === "global" && value && typeof value === "object") {
            for (const [globalName, globalDef] of Object.entries(value as Record<string, any>)) {
                if (typeof globalDef === "string") {
                    entries.push({ name: globalName, type: globalDef });
                } else if (globalDef && typeof globalDef === "object") {
                    entries.push({ name: globalName, ...(globalDef as Record<string, any>) });
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
    for (const [variable, raw] of Object.entries(globals as Record<string, any>)) {
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
        description: typeof schema.description === "string" ? schema.description : undefined,
        author: typeof schema.author === "string" ? schema.author : undefined,
        repository,
        dependencies: Array.isArray(schema.dependencies) ? schema.dependencies.filter((dep: any) => typeof dep === "string") : [],
        directives: Array.isArray(schema.directives) ? schema.directives : [],
        elements: Array.isArray(schema.elements) ? schema.elements : [],
        attributes: normalizeAttributes(schema.attributes),
        types: normalizeTypes(schema.types, schema.globals),
        tools: schema.tools && typeof schema.tools === "object" ? (schema.tools as Record<string, any>) : {},
    };
}

function normalizeLegacyPkgSchema(legacy: any): KireSchemaShape {
    if (!legacy || typeof legacy !== "object") return createEmptySchema();

    return {
        name: typeof legacy.package === "string" ? legacy.package : undefined,
        version: typeof legacy.version === "string" ? legacy.version : undefined,
        repository: safeResolveRepository(legacy.repository),
        dependencies: Array.isArray(legacy.dependencies) ? legacy.dependencies.filter((dep: any) => typeof dep === "string") : [],
        directives: Array.isArray(legacy.directives) ? legacy.directives : [],
        elements: Array.isArray(legacy.elements) ? legacy.elements : [],
        attributes: normalizeAttributes(legacy.attributes),
        types: normalizeTypes(undefined, legacy.globals),
        tools: {},
    };
}

function mergeNamedList(target: any[], incoming: any[], key: "name" | "variable" = "name") {
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

function mergeSchema(target: KireSchemaShape, source: Partial<KireSchemaShape> | undefined | null) {
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

function extractEngineSchema(engine: any, fallbackMeta: { name?: string; repository?: string; version?: string }): KireSchemaShape {
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

async function loadSchemaModule(uri: vscode.Uri, engine: any, collected: KireSchemaShape) {
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
        const schema = (mod?.default ?? mod) as Partial<KireSchemaDefinition> | undefined;
        if (!schema || typeof schema !== "object") return;

        mergeSchema(collected, normalizeSchemaLike(schema));
        kireLog("debug", `Schema parsed: ${modulePath}`);

        if (schema.name || schema.version || schema.author || schema.repository || schema.description) {
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
            try {
                await Promise.resolve(schema.handle(engine));
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
    const state = kireStore.getState();
    state.clear();
    kireLog("info", "Starting schema load.");

    const Kire = resolveKireConstructor();
    const engine = new Kire({
        production: true,
        silent: true,
    });
    state.setEngine(engine);
    const collected = createEmptySchema();

    if (typeof (engine as any).use !== "function" && typeof (engine as any).plugin === "function") {
        (engine as any).use = (plugin: any, opts?: any) => (engine as any).plugin(plugin, opts);
    }

    if (typeof (engine as any).kireSchema !== "function") {
        (engine as any).kireSchema = (partial: any) => {
            mergeSchema(collected, normalizeSchemaLike(partial));
            return engine;
        };
    }

    try {
        const config = vscode.workspace.getConfiguration("kire");
        const scanNodeModules = config.get<boolean>("schema.scanNodeModules", false);

        const [moduleWorkspace, moduleNodeModules] = await Promise.all([
            vscode.workspace.findFiles("**/kire.schema.js", "**/{node_modules,publish,.git,dist,coverage,test-results,playwright-report}/**"),
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

        mergeSchema(collected, extractEngineSchema(engine, state.metadata));
        state.applyKireSchema(collected as any);
        kireLog(
            "info",
            `Schema load completed in ${Date.now() - startedAt}ms. directives=${collected.directives?.length || 0}, elements=${collected.elements?.length || 0}, attributes=${collected.attributes?.length || 0}, types=${collected.types?.length || 0}`,
        );
    } catch (error) {
        kireLog("error", `Error loading schemas: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.error("Error loading Kire schemas:", error);
    }
}
