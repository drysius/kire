import type { Kire, KireRendered } from "kire";

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
            for (const [key, descriptor] of Object.entries(descriptors)) {
                if (key === "constructor" || key in locals) continue;
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
            (this as any)[property] = value;
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
        obj[parts[parts.length - 1]!] = value;
    }

    /**
     * Validation helper (Stub for compatibility)
     */
    public validate(rules: any): boolean {
        console.warn("Validation is not yet fully implemented in Kirewire Kernel.");
        return true;
    }

    /**
     * Rule helper (Stub for compatibility)
     */
    public rule(ruleStr: string, message?: string): any {
        return { ruleStr, message };
    }

    /**
     * Error bag for form-like components.
     */
    protected __errors: Record<string, string> = {};

    private static readonly __completedUpload = {
        progress: 100,
        percent: 100,
        loaded: 0,
        total: 0,
    };

    /**
     * Internal tracking of side effects to be sent to the client.
     */
    public __effects = {
        events: [] as Array<{ name: string, params: any[] }>,
        redirect: null as string | null,
        streams: [] as Array<{ target: string, content: string, method: string }>
    };

    /**
     * Resets all pending effects.
     */
    public $clearEffects() {
        this.__effects.events = [];
        this.__effects.redirect = null;
        this.__effects.streams = [];
    }

    /**
     * Emits an event to the browser and other components on the same page.
     */
    public emit(name: string, ...params: any[]) {
        this.__effects.events.push({ name, params });
        // Also trigger internal server-side emit if wire instance is available
        if ((this as any).$wire_instance) {
            (this as any).$wire_instance.$emit(`event:${name}`, { params, sourceId: this.$id });
        }
    }

    public $emit(name: string, ...params: any[]) { this.emit(name, ...params); }

    /**
     * Redirects the user to a new URL.
     */
    public redirect(url: string) {
        this.__effects.redirect = url;
    }

    public $redirect(url: string) { this.redirect(url); }

    /**
     * Sends a direct HTML stream update to a specific target.
     */
    public stream(
        target: string,
        content: string,
        methodOrReplace: 'update' | 'append' | 'prepend' | boolean = 'update',
        legacyMethod?: 'update' | 'append' | 'prepend'
    ) {
        const method = typeof methodOrReplace === "boolean"
            ? (legacyMethod || 'update')
            : methodOrReplace;
        this.__effects.streams.push({ target, content, method });
    }

    public $stream(target: string, content: string, method: 'update' | 'append' | 'prepend' = 'update') {
        this.stream(target, content, method);
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
     * special runtime objects like WireBroadcast and WireFile.
     */
    public fill(state: Record<string, any>) {
        for (const [key, value] of Object.entries(state || {})) {
            if (!(key in this)) continue;

            const current = (this as any)[key];

            // Never replace broadcast instances with plain objects from the client.
            if (this.isBroadcastLike(current)) continue;

            // Keep WireFile instances and only refresh its serializable fields.
            if (this.isWireFileLike(current) && value && typeof value === "object" && (value as any)._wire_type === "WireFile") {
                current.options = (value as any).options || {};
                current.files = (value as any).files || [];
                current.uploading = (value as any).uploading || { ...Component.__completedUpload };
                continue;
            }

            if (typeof current === "string" && value && typeof value === "object") {
                (this as any)[key] = "";
                continue;
            }

            (this as any)[key] = value;
        }
    }

    /**
     * Returns only serializable/public state for hydration roundtrips.
     */
    public getPublicState(): Record<string, any> {
        const state: Record<string, any> = {};
        for (const key of Object.keys(this as any)) {
            const value = (this as any)[key];
            if (key.startsWith("$") || key.startsWith("_")) continue;
            if (typeof value === "function") continue;
            if (this.isBroadcastLike(value)) continue;
            state[key] = value;
        }
        return state;
    }

    protected isBroadcastLike(value: any): boolean {
        return !!value
            && typeof value === "object"
            && typeof value.hydrate === "function"
            && typeof value.update === "function"
            && typeof value.getChannel === "function";
    }

    protected isWireFileLike(value: any): boolean {
        return !!value
            && typeof value === "object"
            && Array.isArray(value.files)
            && typeof value.populate === "function";
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
