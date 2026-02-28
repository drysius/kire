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
        // Merge this instance (properties and methods) with provided data
        // Expose instance as $wire for compatibility with alpine magic
        return this.$kire.view(view, { ...this, $wire: this, ...data });
    }

    /**
     * Helper to set property values from the client.
     */
    public $set(property: string, value: any) {
        (this as any)[property] = value;
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

    /**
     * Redirects the user to a new URL.
     */
    public redirect(url: string) {
        this.__effects.redirect = url;
    }

    /**
     * Sends a direct HTML stream update to a specific target.
     */
    public stream(target: string, content: string, method: 'update' | 'append' | 'prepend' = 'update') {
        this.__effects.streams.push({ target, content, method });
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
