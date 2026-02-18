import type { Kire } from "../kire";
import type { 
    DirectiveDefinition, 
    ElementDefinition, 
    KireSchemaObject, 
    TypeDefinition, 
    KireAttributeDeclaration, 
    KireHandler 
} from "../types";
import { createFastMatcher } from "./regex";

export function kireSchema(this: Kire<any>, def: Partial<KireSchemaObject>) { 
    Object.assign(this.$schema, def); 
    return this; 
}

export function type(this: Kire<any>, def: TypeDefinition) { 
    this.$schema.types.push(def);
    return this; 
}

export function attribute(this: Kire<any>, def: KireAttributeDeclaration) {
    this.$schema.attributes.push(def);
    return this;
}

export function directive(this: Kire<any>, def: DirectiveDefinition) {
    this.$kire["~directives"].records[def.name] = def;
    this.$kire["~directives"].pattern = createFastMatcher(Object.keys(this.$kire["~directives"].records));
    this.$schema.directives.push({
        name: def.name,
        description: def.description,
        params: def.params,
        children: def.children,
        example: def.example,
        related: def.related,
        exposes: def.exposes
    });
    return this;
}

export function element(this: Kire<any>, def: ElementDefinition) {
    this.$kire["~elements"].list.push(def);
    this.$kire["~elements"].matchers.unshift({ def });
    const names = this.$kire["~elements"].list.map(d => d.name instanceof RegExp ? d.name.source : d.name);
    this.$kire["~elements"].pattern = createFastMatcher(names);
    if (typeof def.name === 'string') {
        this.$schema.elements.push({
            name: def.name,
            description: def.description,
            void: def.void,
            attributes: def.attributes,
            example: def.example,
            related: def.related
        });
    }
    return this;
}

export function existVar(this: Kire<any>, name: string | RegExp, callback: KireHandler, unique = false) {
    const handlers = this.$kire["~handlers"];
    let list = handlers.exists_vars.get(name);
    if (!list) {
        list = [];
        handlers.exists_vars.set(name, list);
    }
    list.push({ name, unique, callback });
    return this;
}
