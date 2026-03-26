import { createStore } from "zustand/vanilla";
import { kireLog } from "./log";

type KireInstance = any;

interface KireSchemaShape {
	directives?: any[];
	elements?: any[];
	attributes?: any[];
	types?: any[];
	tools?: Record<string, any> | any[];
}

export interface DirectiveDefinition {
	name: string;
	package?: PackageMetadata;
	signature?: string[];
	declares?: Array<{
		name?: string;
		type?: string;
		description?: string;
		fromArg?: number;
		fromAttribute?: string;
		pattern?: string;
		capture?: string | string[];
	}>;
	children?: boolean | "auto";
	description?: string;
	example?: string;
	related?: string[];
	parents?: Array<{ name: string }>;
	[key: string]: any;
}

export interface ElementDefinition {
	name: string;
	package?: PackageMetadata;
	description?: string;
	example?: string;
	void?: boolean;
	attributes?:
		| Array<
				| AttributeDefinition
				| {
						name: string;
						type?: string | string[];
						description?: string;
						example?: string;
				  }
		  >
		| Record<string, AttributeDefinition | string>;
	declares?: Array<{
		name?: string;
		type?: string;
		description?: string;
		fromArg?: number;
		fromAttribute?: string;
		pattern?: string;
		capture?: string | string[];
	}>;
	[key: string]: any;
}

export interface AttributeDefinition {
	name?: string;
	package?: PackageMetadata;
	type: string | string[];
	comment?: string;
	description?: string;
	example?: string;
	separator?: string;
	[key: string]: any;
}

export interface PackageMetadata {
	name?: string;
	version?: string;
	description?: string;
	author?: string;
	repository?: string;
}

export interface ToolDefinition {
	package?: PackageMetadata;
	type?: string | string[];
	tstype?: string;
	comment?: string;
	description?: string;
	example?: string;
	separator?: string;
	[key: string]: any;
}

export interface KireState {
	engine: KireInstance | null;
	directives: Map<string, DirectiveDefinition>;
	elements: Map<string, ElementDefinition>;
	attributes: Map<string, AttributeDefinition>;
	globals: Map<string, any>;
	tools: Map<string, ToolDefinition>;
	metadata: PackageMetadata;
	parentDirectives: Map<string, string[]>;
	revision: number;
	lastMutation?: string;
	setEngine: (engine: KireInstance | null) => void;
	applyKireSchema: (schema: KireSchemaShape & Record<string, any>) => void;
	setMetadata: (meta: PackageMetadata) => void;
	clear: () => void;
}

function nextMutation(state: KireState, mutation: string) {
	return {
		revision: state.revision + 1,
		lastMutation: mutation,
	};
}

function normalizeAttribute(def: any): AttributeDefinition {
	if (!def) return { type: "any" };
	if (typeof def === "string") return { type: def };
	return {
		...def,
		type: def.type ?? "any",
		comment: def.comment ?? def.description,
	};
}

function flattenObjectTree(
	root: any,
	onEntry: (name: string, node: any) => void,
	prefix = "",
	inheritedSep = ".",
) {
	if (!root || typeof root !== "object") return;
	const key = root.variable || root.name;
	const separator = root.separator || inheritedSep;
	const current = key ? (prefix ? `${prefix}${separator}${key}` : key) : prefix;

	if (
		current &&
		(root.type || root.tstype || root.description || root.comment)
	) {
		onEntry(current, root);
	}

	if (Array.isArray(root.extends)) {
		for (const child of root.extends) {
			flattenObjectTree(child, onEntry, current, separator);
		}
	}
}

export const kireStore = createStore<KireState>((set) => ({
	engine: null,
	directives: new Map(),
	elements: new Map(),
	attributes: new Map(),
	globals: new Map(),
	tools: new Map(),
	metadata: {},
	parentDirectives: new Map(),
	revision: 0,
	lastMutation: "init",

	setEngine: (engine) =>
		set((state) => {
			kireLog(
				"debug",
				`Kire store setEngine: ${engine ? engine.constructor?.name || "engine" : "null"}`,
			);
			return {
				engine,
				...nextMutation(state, "setEngine"),
			};
		}),

	applyKireSchema: (schema) =>
		set((state) => {
			const directives = new Map(state.directives);
			const elements = new Map(state.elements);
			const attributes = new Map(state.attributes);
			const globals = new Map(state.globals);
			const tools = new Map(state.tools);
			const parentDirectives = new Map(state.parentDirectives);

			const directiveList = Array.isArray(schema.directives)
				? schema.directives
				: [];
			const addParent = (childName: string, parentName: string) => {
				const current = parentDirectives.get(childName) || [];
				if (!current.includes(parentName)) {
					current.push(parentName);
					parentDirectives.set(childName, current);
				}
			};

			for (const raw of directiveList as any[]) {
				if (!raw?.name) continue;
				directives.set(raw.name, raw);

				// Modern shape: related = allowed parent directives for this directive.
				const directParents = Array.isArray(raw.related)
					? raw.related.filter((p: any) => typeof p === "string")
					: [];
				for (const parentName of directParents) {
					addParent(raw.name, parentName);
				}

				// Legacy shape:
				// - parents: string[] => allowed parents for this directive
				// - parents: [{ name: "else" }, ...] => child directives allowed inside current directive
				if (Array.isArray(raw.parents)) {
					for (const parentEntry of raw.parents) {
						if (typeof parentEntry === "string") {
							addParent(raw.name, parentEntry);
							continue;
						}

						if (
							parentEntry &&
							typeof parentEntry === "object" &&
							typeof parentEntry.name === "string"
						) {
							directives.set(parentEntry.name, parentEntry);
							addParent(parentEntry.name, raw.name);
						}
					}
				}
			}

			const elementList = Array.isArray(schema.elements) ? schema.elements : [];
			for (const raw of elementList as any[]) {
				if (!raw?.name) continue;
				elements.set(raw.name, raw);

				if (Array.isArray(raw.attributes)) {
					for (const attr of raw.attributes) {
						if (!attr?.name) continue;
						attributes.set(attr.name, normalizeAttribute(attr));
					}
				} else if (raw.attributes && typeof raw.attributes === "object") {
					for (const [name, attr] of Object.entries(raw.attributes)) {
						attributes.set(name, normalizeAttribute(attr));
					}
				}
			}

			const attrList = Array.isArray(schema.attributes)
				? schema.attributes
				: [];
			for (const raw of attrList as any[]) {
				if (!raw?.name) continue;
				attributes.set(raw.name, normalizeAttribute(raw));
			}

			const typeList = Array.isArray(schema.types) ? schema.types : [];
			for (const typeDef of typeList as any[]) {
				if (!typeDef?.variable) continue;
				globals.set(typeDef.variable, {
					type: typeDef.tstype || typeDef.type || "any",
					comment: typeDef.comment,
				});
			}

			const schemaTools = schema.tools;
			if (schemaTools && typeof schemaTools === "object") {
				if (Array.isArray(schemaTools)) {
					for (const entry of schemaTools) {
						flattenObjectTree(entry, (name, node) => {
							tools.set(name, node);
						});
					}
				} else {
					for (const [name, value] of Object.entries(schemaTools)) {
						if (value && typeof value === "object" && (value as any).extends) {
							flattenObjectTree({ name, ...(value as any) }, (key, node) => {
								tools.set(key, node);
							});
						} else {
							tools.set(name, value as ToolDefinition);
						}
					}
				}
			}

			kireLog(
				"debug",
				`Kire store applyKireSchema: directives=${directives.size}, elements=${elements.size}, attributes=${attributes.size}, globals=${globals.size}, tools=${tools.size}`,
			);

			return {
				directives,
				elements,
				attributes,
				globals,
				tools,
				parentDirectives,
				...nextMutation(state, "applyKireSchema"),
			};
		}),

	setMetadata: (meta) =>
		set((state) => {
			const metadata = {
				...state.metadata,
				...meta,
			};
			kireLog(
				"debug",
				`Kire store setMetadata: ${metadata.name || "unknown"}@${metadata.version || "0.0.0"}`,
			);
			return {
				metadata,
				...nextMutation(state, "setMetadata"),
			};
		}),

	clear: () =>
		set((state) => {
			kireLog("debug", "Kire store cleared.");
			return {
				engine: null,
				directives: new Map(),
				elements: new Map(),
				attributes: new Map(),
				globals: new Map(),
				tools: new Map(),
				metadata: {},
				parentDirectives: new Map(),
				...nextMutation(state, "clear"),
			};
		}),
}));
