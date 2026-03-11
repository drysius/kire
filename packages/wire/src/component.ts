import type { Kire, KireRendered } from "kire";
import { WireProperty } from "./wire-property";
import {
    type ComponentRuleDescriptor,
    type ValidationResult,
    isTypeBoxSchema,
    makeRuleDescriptor,
    validateRuleString,
    validateTypeBoxSchema,
} from "./validation/rule";

export type WireEffect = {
    type: string;
    payload: any;
};

export type WireCollectionAction = "replace" | "append" | "prepend" | "upsert" | "remove";
export type WireCollectionMode = "state" | "dom";

export type WireCollectionPayload = {
    name: string;
    action: WireCollectionAction;
    mode?: WireCollectionMode;
    path?: string;
    key?: string;
    keys?: Array<string | number>;
    items?: any[];
    content?: string;
    limit?: number;
    position?: "append" | "prepend";
};

/**
 * Base Component class for Kirewire.
 */
export abstract class Component {
    /**
     * Unique ID for this component instance on the page.
     * Managed by Kirewire.
     */
    public $id!: string;

    /**
     * Reference to the Kire engine instance.
     */
    protected $kire!: Kire;

    /**
     * Renders the component view.
     * @param view Path to the kire view file.
     * @param data Additional locals for rendering.
     */
    public view(view: string, data: Record<string, any> = {}): KireRendered {
        const locals: Record<string, any> = { ...(this as any), ...data };

        // Materialize computed getters as own props so they survive Kire fork
        // prop-merging (which can drop prototype chain from locals).
        let proto = Object.getPrototypeOf(this);
        while (proto && proto !== Object.prototype) {
            const descriptors = Object.getOwnPropertyDescriptors(proto);
            const keys = Object.keys(descriptors);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key === "constructor" || key in locals) continue;
                const descriptor = descriptors[key];
                if (typeof descriptor.get === "function") {
                    try {
                        locals[key] = (this as any)[key];
                    } catch {
                        // Ignore failing computed getters during template hydration.
                    }
                }
            }
            proto = Object.getPrototypeOf(proto);
        }

        if (!Object.prototype.hasOwnProperty.call(locals, "errors")) {
            locals.errors = this.__errors;
        }

        (locals as any).$wire = this;
        return this.$kire.view(view, locals);
    }

    /**
     * Helper to set property values from the client.
     * Supports dot notation for nested properties.
     */
    public $set(property: string, value: any) {
        if (!property.includes('.')) {
            const current = (this as any)[property];
            (this as any)[property] = this.normalizeIncomingValue(current, value);
            return;
        }

        const parts = property.split('.');
        let obj = this as any;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i]!;
            if (!(part in obj) || obj[part] === null || typeof obj[part] !== 'object') {
                obj[part] = {};
            }
            obj = obj[part];
        }
        const leaf = parts[parts.length - 1]!;
        obj[leaf] = this.normalizeIncomingValue(obj[leaf], value);
    }

    public validate(
        rules: Record<
            string,
            | string
            | ComponentRuleDescriptor
            | ((value: any, state?: Record<string, any>) => boolean | string | undefined)
            | any[]
        >,
    ): boolean {
        this.clearErrors();
        let isValid = true;
        const state = this.getPublicState();

        for (const [field, validatorOrArray] of Object.entries(rules || {})) {
            const value = this.getValueByPath(field);
            const validators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];

            for (const validator of validators) {
                const result = this.runValidator(value, validator, state);
                if (!result.success) {
                    this.addError(field, result.error || "Invalid");
                    isValid = false;
                    break;
                }
            }
        }

        return isValid;
    }

    public rule(ruleStr: string, message?: string): ComponentRuleDescriptor {
        return makeRuleDescriptor(ruleStr, message);
    }

    /**
     * Error bag for form-like components.
     */
    protected __errors: Record<string, string> = {};

    /**
     * Internal tracking of side effects to be sent to the client.
     */
    public __effects: Array<WireEffect> = [];

    /**
     * Allows one response cycle to skip HTML morphing and send only state/effects.
     */
    public __skipRender = false;

    /**
     * Resets all pending effects.
     */
    public $clearEffects() {
        this.__effects = [];
    }

    /**
     * Emits an effect to the browser.
     */
    public $effect(type: string, payload: any) {
        this.__effects.push({ type, payload });
    }

    public skipRender(value = true) {
        this.__skipRender = !!value;
    }

    public $skipRender(value = true) {
        this.skipRender(value);
    }

    /**
     * Emits an event to the browser and other components on the same page.
     */
    public emit(name: string, ...params: any[]) {
        this.$effect("event", { name, params });
        // Trigger internal server-side emit if wire instance is available
        if ((this as any).$wire_instance) {
            (this as any).$wire_instance.emit(`event:${name}`, { params, sourceId: this.$id });
        }
    }

    public $emit(name: string, ...params: any[]) { this.emit(name, ...params); }

    /**
     * Redirects the user to a new URL.
     */
    public redirect(url: string) {
        this.$effect("redirect", url);
    }

    public $redirect(url: string) { this.redirect(url); }

    /**
     * Sends a direct HTML stream update to a specific target.
     */
    public stream(
        target: string,
        content: string,
        method: 'update' | 'append' | 'prepend' = 'update'
    ) {
        this.$effect("stream", { target, content, method });
    }

    public $stream(target: string, content: string, method: 'update' | 'append' | 'prepend' = 'update') {
        this.stream(target, content, method);
    }

    public collection(name: string, payload: Omit<WireCollectionPayload, "name">) {
        const target = String(name || "").trim();
        if (!target) return;
        this.$effect("collection", {
            name: target,
            ...payload,
        });
    }

    public replaceCollection<T = any>(
        path: string,
        items: T[] = [],
        options: { key?: string; limit?: number } = {},
    ) {
        this.collection(path, {
            mode: "state",
            path,
            action: "replace",
            items: Array.isArray(items) ? items : [],
            key: options.key || "id",
            limit: options.limit,
        });
    }

    public appendToCollection<T = any>(
        path: string,
        items: T | T[],
        options: { key?: string; limit?: number } = {},
    ) {
        const list = Array.isArray(items) ? items : [items];
        this.collection(path, {
            mode: "state",
            path,
            action: "append",
            items: list.filter((item) => item !== undefined && item !== null),
            key: options.key || "id",
            limit: options.limit,
        });
    }

    public prependToCollection<T = any>(
        path: string,
        items: T | T[],
        options: { key?: string; limit?: number } = {},
    ) {
        const list = Array.isArray(items) ? items : [items];
        this.collection(path, {
            mode: "state",
            path,
            action: "prepend",
            items: list.filter((item) => item !== undefined && item !== null),
            key: options.key || "id",
            limit: options.limit,
        });
    }

    public upsertCollection<T = any>(
        path: string,
        items: T | T[],
        options: { key?: string; limit?: number; position?: "append" | "prepend" } = {},
    ) {
        const list = Array.isArray(items) ? items : [items];
        this.collection(path, {
            mode: "state",
            path,
            action: "upsert",
            items: list.filter((item) => item !== undefined && item !== null),
            key: options.key || "id",
            limit: options.limit,
            position: options.position || "append",
        });
    }

    public removeFromCollection(
        path: string,
        keys: Array<string | number> | string | number,
        options: { key?: string } = {},
    ) {
        const list = Array.isArray(keys) ? keys : [keys];
        this.collection(path, {
            mode: "state",
            path,
            action: "remove",
            keys: list.filter((item) => item !== undefined && item !== null),
            key: options.key || "id",
        });
    }

    public replaceCollectionHtml(name: string, content: string) {
        this.collection(name, {
            mode: "dom",
            action: "replace",
            content: String(content || ""),
        });
    }

    public appendCollectionHtml(
        name: string,
        content: string,
        options: { key?: string | number } = {},
    ) {
        this.collection(name, {
            mode: "dom",
            action: "append",
            content: String(content || ""),
            key: options.key === undefined || options.key === null ? undefined : String(options.key),
        });
    }

    public prependCollectionHtml(
        name: string,
        content: string,
        options: { key?: string | number } = {},
    ) {
        this.collection(name, {
            mode: "dom",
            action: "prepend",
            content: String(content || ""),
            key: options.key === undefined || options.key === null ? undefined : String(options.key),
        });
    }

    public upsertCollectionHtml(
        name: string,
        content: string,
        options: { key: string | number; position?: "append" | "prepend" } ,
    ) {
        this.collection(name, {
            mode: "dom",
            action: "upsert",
            content: String(content || ""),
            key: String(options.key),
            position: options.position || "append",
        });
    }

    public removeCollectionHtml(
        name: string,
        keys: Array<string | number> | string | number,
    ) {
        const list = Array.isArray(keys) ? keys : [keys];
        this.collection(name, {
            mode: "dom",
            action: "remove",
            keys: list
                .filter((item) => item !== undefined && item !== null)
                .map((item) => String(item)),
        });
    }

    public addError(field: string, message: string) {
        this.__errors[field] = message;
    }

    public clearErrors(field?: string) {
        if (field) delete this.__errors[field];
        else this.__errors = {};
    }

    /**
     * Fills component state from serialized client payload while preserving
     * specialized WireProperty objects.
     */
    public fill(state: Record<string, any>) {
        if (!state) return;
        const keys = Object.keys(state);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!(key in this)) continue;

            const current = (this as any)[key];
            const value = state[key];

            if (current instanceof WireProperty) {
                current.hydrate(value);
            } else {
                (this as any)[key] = value;
            }
        }
    }

    /**
     * Returns only serializable/public state for hydration roundtrips.
     */
    public getPublicState(): Record<string, any> {
        const state: Record<string, any> = Object.create(null);
        const keys = Object.keys(this);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.charCodeAt(0) === 36 || key.charCodeAt(0) === 95) continue; // Skip $ and _
            
            const value = (this as any)[key];
            if (typeof value === "function") continue;
            
            if (value instanceof WireProperty) {
                state[key] = value.dehydrate();
            } else {
                state[key] = value;
            }
        }
        return state;
    }

    protected normalizeIncomingValue(current: any, value: any): any {
        if (current instanceof WireProperty) {
            current.hydrate(value);
            return current;
        }
        return value;
    }

    protected unpackEvent<T = any>(event?: unknown): T | null {
        const payload = (event as any)?.params?.[0]
            ?? (event as any)?.detail?.params?.[0]
            ?? (event as any)?.detail
            ?? event;

        if (payload === undefined || payload === null) return null;
        return payload as T;
    }

    protected appendUniqueBy<T extends Record<string, any>>(
        list: T[],
        item: T | null | undefined,
        key: keyof T | string = "id",
    ): T[] {
        if (!item) return Array.isArray(list) ? list : [];
        const normalized = Array.isArray(list) ? list : [];
        const needle = (item as any)[key as string];
        if (needle === undefined || needle === null) return [...normalized, item];
        if (normalized.some((entry) => (entry as any)?.[key as string] === needle)) return normalized;
        return [...normalized, item];
    }

    protected prependUniqueBy<T extends Record<string, any>>(
        list: T[],
        item: T | null | undefined,
        key: keyof T | string = "id",
    ): T[] {
        if (!item) return Array.isArray(list) ? list : [];
        const normalized = Array.isArray(list) ? list : [];
        const needle = (item as any)[key as string];
        if (needle === undefined || needle === null) return [item, ...normalized];
        if (normalized.some((entry) => (entry as any)?.[key as string] === needle)) return normalized;
        return [item, ...normalized];
    }

    protected upsertBy<T extends Record<string, any>>(
        list: T[],
        item: T | null | undefined,
        key: keyof T | string = "id",
        mode: "append" | "prepend" = "append",
    ): T[] {
        if (!item) return Array.isArray(list) ? list : [];
        const normalized = Array.isArray(list) ? list : [];
        const needle = (item as any)[key as string];
        if (needle === undefined || needle === null) {
            return mode === "prepend" ? [item, ...normalized] : [...normalized, item];
        }

        const next = normalized.filter((entry) => (entry as any)?.[key as string] !== needle);
        return mode === "prepend" ? [item, ...next] : [...next, item];
    }

    private runValidator(
        value: any,
        validator: any,
        state: Record<string, any>,
    ): ValidationResult {
        if (typeof validator === "function") {
            const result = validator(value, state);
            if (result === false) return { success: false, error: "Invalid" };
            if (typeof result === "string") return { success: false, error: result };
            return { success: true };
        }

        if (typeof validator === "string") {
            return validateRuleString(this.normalizeValidationValue(value), validator);
        }

        if (validator && typeof validator === "object") {
            // Check for file rule or other specialized validators via duck typing or instanceof
            if (typeof validator.validate === "function") {
                const result = validator.validate(value);
                if (result.success) return { success: true };
                return { success: false, error: result.errors?.[0] || "Invalid." };
            }

            if ("ruleStr" in validator && "schema" in validator) {
                const helper = validator as ComponentRuleDescriptor;
                return validateRuleString(this.normalizeValidationValue(value), helper.ruleStr, helper.message);
            }

            if (isTypeBoxSchema(validator)) {
                return validateTypeBoxSchema(validator, this.normalizeValidationValue(value));
            }
        }

        return { success: true };
    }

    private normalizeValidationValue(value: any): any {
        if (value instanceof WireProperty) {
            return value.dehydrate();
        }
        return value;
    }

    private getValueByPath(path: string): any {
        if (!path.includes(".")) {
            return (this as any)[path];
        }

        const parts = path.split(".");
        let current: any = this;
        for (let i = 0; i < parts.length; i++) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[parts[i]];
        }
        return current;
    }

    /**
     * Lifecycle hook: Called after the component is instantiated and state is hydrated.
     */
    public mount(): void | Promise<void> {}

    /**
     * Lifecycle hook: Called before the component is removed from memory.
     * Use this to cleanup resources, listeners, etc.
     */
    public unmount(): void | Promise<void> {}

    /**
     * Default render method. Must be implemented by the user.
     * Should return a call to this.view().
     */
    abstract render(): KireRendered;
}

