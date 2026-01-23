import { createStore } from "zustand/vanilla";

export interface DirectiveDefinition {
	name: string;
	params?: string[];
	children?: boolean | "auto";
	type?: "css" | "js" | "html";
	description?: string;
	example?: string;
	parents?: DirectiveDefinition[];
}

export interface ElementDefinition {
	name: string;
	description?: string;
	example?: string;
	void?: boolean;
	type?: "html" | "javascript" | "css";
	attributes?: Record<string, AttributeDefinition | string>;
}

export interface AttributeDefinition {
	type: string;
	comment?: string;
	example?: string;
}

export interface KireState {
	directives: Map<string, DirectiveDefinition>;
	elements: Map<string, ElementDefinition>;
	attributes: Map<string, AttributeDefinition>;
	// Helpers to quickly find parent directives for sub-directives
	parentDirectives: Map<string, string[]>; // subDirective -> [parentName1, parentName2]
	addDirectives: (directives: DirectiveDefinition[]) => void;
	addElements: (elements: ElementDefinition[]) => void;
	addAttributes: (attributes: Record<string, Record<string, any>>) => void;
	clear: () => void;
}

export const kireStore = createStore<KireState>((set) => ({
	directives: new Map(),
	elements: new Map(),
	attributes: new Map(),
	parentDirectives: new Map(),
	addDirectives: (directives) =>
		set((state) => {
			const newMap = new Map(state.directives);
			const newParents = new Map(state.parentDirectives);

			directives.forEach((d) => {
				newMap.set(d.name, d);
				// Handle nested parents/sub-directives
				if (d.parents) {
					d.parents.forEach((p) => {
						// p is a sub-directive definition (like elseif)
						// It might not have a full definition in the top-level list, or it might.
						// Usually sub-directives are defined inline in the schema under 'parents'.
						// We should probably index them too if we want to hover over @elseif
						newMap.set(p.name, p);

						const parents = newParents.get(p.name) || [];
						if (!parents.includes(d.name)) {
							parents.push(d.name);
						}
						newParents.set(p.name, parents);
					});
				}
			});
			return { directives: newMap, parentDirectives: newParents };
		}),
	addElements: (elements) =>
		set((state) => {
			const newMap = new Map(state.elements);
			elements.forEach((e) => newMap.set(e.name, e));
			return { elements: newMap };
		}),
	addAttributes: (schemas) =>
		set((state) => {
			const newMap = new Map(state.attributes);
			// Process 'global' attributes
			if (schemas.global) {
				Object.entries(schemas.global).forEach(([key, def]) => {
					if (typeof def === "string") {
						newMap.set(key, { type: def });
					} else {
						newMap.set(key, def as AttributeDefinition);
					}
				});
			}
			// Future: process tag-specific attributes if needed
			return { attributes: newMap };
		}),
	clear: () =>
		set({
			directives: new Map(),
			elements: new Map(),
			attributes: new Map(),
			parentDirectives: new Map(),
		}),
}));
