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
        return this.$kire.view(view, { ...this, ...data });
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
