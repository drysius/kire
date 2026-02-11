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
	type: string | string[];
	comment?: string;
	example?: string;
    separator?: string;
}

export interface PackageMetadata {
    name?: string;
    version?: string;
    author?: string;
    repository?: string;
}

export interface KireState {
	directives: Map<string, DirectiveDefinition>;
	elements: Map<string, ElementDefinition>;
	attributes: Map<string, AttributeDefinition>;
    globals: Map<string, any>;
    metadata: PackageMetadata;
	parentDirectives: Map<string, string[]>;
	addDirectives: (directives: Record<string, any> | DirectiveDefinition[]) => void;
	addElements: (elements: Record<string, any> | any[]) => void;
	addAttributes: (attributes: Record<string, Record<string, any>>) => void;
    addGlobals: (globals: Record<string, any> | any[]) => void;
    setMetadata: (meta: PackageMetadata) => void;
	clear: () => void;
}

export const kireStore = createStore<KireState>((set) => ({
	directives: new Map(),
	elements: new Map(),
	attributes: new Map(),
    globals: new Map(),
    metadata: {},
	parentDirectives: new Map(),
    setMetadata: (meta) => set({ metadata: meta }),
	addDirectives: (directives) =>
		set((state) => {
			const newMap = new Map(state.directives);
			const newParents = new Map(state.parentDirectives);

            const processDef = (d: any) => {
                newMap.set(d.name, d);
				if (d.parents) {
					d.parents.forEach((p: any) => {
						// Sub-directives might be full definitions or refs
                        // Since schema now outputs full objects in 'parents', we treat them as definitions
                        if (p.name) newMap.set(p.name, p);
						
                        const parents = newParents.get(p.name) || [];
						if (!parents.includes(d.name)) {
							parents.push(d.name);
						}
						newParents.set(p.name, parents);
					});
				}
            };

            if (Array.isArray(directives)) {
			    directives.forEach(processDef);
            } else {
                Object.values(directives).forEach(processDef);
            }
            
			return { directives: newMap, parentDirectives: newParents };
		}),
	addElements: (elements) =>
		set((state) => {
			const newElements = new Map(state.elements);
            const newAttributes = new Map(state.attributes);

            const processTree = (node: any, prefix: string, sep: string) => {
                 const currentKey = prefix ? prefix + sep + (node.variable || node.name) : (node.variable || node.name);
                 
                 // If array of children directly? No, structure is Node object.
                 if (!currentKey) return; // Should not happen if schema is valid

                 if (node.description || node.comment || node.type || node.example) {
                    if (node.type === 'element') {
                        newElements.set(currentKey, { name: currentKey, ...node });
                    } else {
                        // Attribute or generic type
                        newAttributes.set(currentKey, { type: node.type || "string", comment: node.comment || node.description, example: node.example });
                    }
                 }
                 
                 if (node.extends && Array.isArray(node.extends)) {
                     const nextSep = node.separator || ""; 
                     node.extends.forEach((child: any) => processTree(child, currentKey, nextSep));
                 }
            };

            if (Array.isArray(elements)) {
			    elements.forEach((e) => {
                    // Check if it's new Tree format (has variable) or legacy flat (has name)
                    if (e.variable) {
                        processTree(e, "", "");
                    } else if (e.name) {
                        // Legacy flat definition
                        newElements.set(e.name, e);
                    }
                });
            } else {
                // Object-based legacy structure
                // ... same as before or skipped
            }
            
			return { elements: newElements, attributes: newAttributes };
		}),
    addGlobals: (globals) =>
        set((state) => {
            const newMap = new Map(state.globals);
            
            const processTree = (node: any, prefix: string, sep: string) => {
                 const currentKey = prefix ? prefix + sep + (node.variable || node.name) : (node.variable || node.name);
                 
                 if (node.description || node.comment || node.type) {
                     newMap.set(currentKey, node);
                 }
                 
                 if (node.extends && Array.isArray(node.extends)) {
                     const nextSep = node.separator || "."; 
                     node.extends.forEach((child: any) => processTree(child, currentKey, nextSep));
                 }
            };

            if (Array.isArray(globals)) {
                globals.forEach(g => {
                    if (g.variable) processTree(g, "", "");
                    else {
                        // Maybe flat?
                    }
                });
            } else {
                // Legacy object map
                Object.entries(globals).forEach(([k, v]) => newMap.set(k, v));
            }
            return { globals: newMap };
        }),
	addAttributes: (schemas) =>
		set((state) => {
			const newMap = new Map(state.attributes);
			if (schemas.global) {
				Object.entries(schemas.global).forEach(([key, def]) => {
					if (typeof def === "string") {
						newMap.set(key, { type: def });
					} else {
						newMap.set(key, def as AttributeDefinition);
					}
				});
			}
			return { attributes: newMap };
		}),
	clear: () =>
		set({
			directives: new Map(),
			elements: new Map(),
			attributes: new Map(),
            globals: new Map(),
            metadata: {},
			parentDirectives: new Map(),
		}),
}));
