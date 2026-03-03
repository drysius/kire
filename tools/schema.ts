import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Kire } from "../core/src/index";
import { getPackages } from "./utils";

const SCHEMA_REF =
	"https://raw.githubusercontent.com/drysius/kire/refs/heads/main/schema.json";

function normalizeRepository(
	repository: any,
): string | { type?: string; url?: string } | undefined {
	if (!repository) return undefined;
	if (typeof repository === "string") return repository;
	if (typeof repository === "object") {
		return {
			type: repository.type,
			url: repository.url,
		};
	}
	return String(repository);
}

function createSerializableJson(value: any): string {
	const seen = new WeakSet<object>();
	return JSON.stringify(
		value,
		(_key, val) => {
			if (typeof val === "function" || typeof val === "symbol") return undefined;
			if (typeof val === "bigint") return val.toString();
			if (val instanceof RegExp) return val.source;
			if (val && typeof val === "object") {
				if (seen.has(val)) return undefined;
				seen.add(val);
			}
			return val;
		},
		4,
	);
}

function createDirectiveSnapshot(def: any) {
	return {
		name: def.name,
		params: def.params,
		children: def.children,
		type: def.type,
		description: def.description,
		comment: def.comment,
		example: def.example,
	};
}

function buildSchemaDocument(kire: Kire<any>, pkg: any) {
	const raw = kire.$schema;
	const attributesGlobal: Record<string, any> = {};

	for (const attr of raw.attributes || []) {
		if (!attr?.name) continue;
		attributesGlobal[attr.name] = {
			type: attr.type ?? "string",
			comment: attr.description,
			example: attr.example,
		};
	}

	const globals = (raw.types || []).map((typeDef) => ({
		variable: typeDef.variable,
		type: typeDef.tstype,
		comment: typeDef.comment,
	}));

	const directives = (raw.directives || []).map((def) => ({ ...def }));
	const directiveByName = new Map(
		directives.map((def) => [def.name, def] as const),
	);

	// Build explicit parent/sub-directive metadata for IntelliSense consumers.
	for (const def of directives) {
		const related = Array.isArray((def as any).related) ? (def as any).related : [];
		const parents = related
			.map((name: string) => {
				const target = directiveByName.get(name);
				return target ? createDirectiveSnapshot(target) : { name };
			})
			.filter((entry: any) => entry?.name);

		if (parents.length > 0) {
			(def as any).parents = parents;
		}
	}

	return {
		$schema: SCHEMA_REF,
		package: pkg.name,
		version: pkg.version,
		author: raw.author || pkg.json.author,
		repository: normalizeRepository(raw.repository || pkg.json.repository),
		dependencies:
			raw.dependencies?.length > 0
				? raw.dependencies
				: Object.keys(pkg.json.dependencies || {}),
		directives,
		elements: raw.elements || [],
		attributes: { global: attributesGlobal },
		globals,
	};
}

function resolvePluginExport(mod: any) {
	let plugin = mod.default ?? mod.plugin;
	if (plugin?.plugin) plugin = plugin.plugin;
	return plugin;
}

export async function generate() {
	console.log("Discovering packages...");
	const packages = await getPackages();
	let failures = 0;

	for (const pkg of packages) {
		console.log(`\nProcessing ${pkg.name}...`);

		try {
			const isCore = pkg.name === "kire";
			const kire = new Kire({ emptykire: !isCore });

			if (!isCore) {
				const entry = join(pkg.path, "src/index.ts");
				if (!existsSync(entry)) {
					console.log(`No src/index.ts found for ${pkg.name}, skipping.`);
					continue;
				}

				const mod = await import(resolve(entry));
				const plugin = resolvePluginExport(mod);

				if (!plugin) {
					console.log(`No plugin export found in ${entry}, skipping.`);
					continue;
				}

				if (typeof plugin === "object" && typeof plugin.load === "function") {
					kire.plugin(plugin);
				} else if (typeof plugin === "function") {
					plugin(kire);
				} else {
					console.log(
						`Export is not a recognized Kire plugin in ${entry}, skipping.`,
					);
					continue;
				}
			}

			const schema = buildSchemaDocument(kire, pkg);
			const outPath = join(pkg.path, "kire-schema.json");
			await writeFile(outPath, createSerializableJson(schema));
			console.log(`Generated kire-schema.json for ${pkg.name}`);
		} catch (e) {
			failures++;
			console.error(`Error processing ${pkg.name}:`, e);
		}
	}

	if (failures > 0) {
		throw new Error(`Schema generation failed for ${failures} package(s).`);
	}
}

generate().catch((error) => {
	console.error(error);
	process.exit(1);
});
