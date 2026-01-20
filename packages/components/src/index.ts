import type { Kire, KirePlugin } from "kire";

interface ComponentOptions {
	path: string;
	prefix?: string;
}

export class KireComponents implements KirePlugin<ComponentOptions> {
	name = "kire-components";
	options: ComponentOptions;

	constructor() {
		this.options = { path: "", prefix: "components" };
	}

	load(kire: Kire, options?: ComponentOptions) {
		const prefix = options?.prefix ?? "components";
		const path = options?.path;

		if (path) {
			kire.namespace(prefix, path);
		}

		// Register the component directive (x-component logic) via a pre-processor or parser hook if possible,
		// but Kire primarily uses directives and elements.
		// Since the request asks for <x-counter /> syntax, we should use kire.element() to catch patterns like x-*

		// We will catch any element starting with "x-"
		kire.element(new RegExp(`x-[a-zA-Z0-9-_.]+`), async (ctx) => {
			const componentName = ctx.element.tagName.replace(/^x-/, "");
			
			// Convert dot notation if needed or just use the name relative to the 'components' namespace
			// e.g. <x-ui.button> -> components.ui.button
			const viewPath = `${prefix}.${componentName}`;

			// Propagate attributes as locals
			const props: Record<string, any> = { ...ctx.element.attributes };
			
			// Resolve attributes that might be reactive or expressions (simplified for now as strings)
			// In a full implementation, we might need to parse ":prop" attributes if Kire supports that in HTML.
			// Standard Kire attributes are strings. If Kire has expression support in attributes (like :name="var"),
			// those would need to be evaluated. For now, we assume standard behavior or Kire's evaluation.
			
			// Support slots
			if (ctx.element.inner && ctx.element.inner.trim() !== "") {
				props.slot = ctx.element.inner;
			}

			try {
				// Render the component view
				// We use kire.view to render the file at 'components.<name>'
				const rendered = await ctx.kire.view(viewPath, props);
				
				// Replace the <x-*> tag with the rendered content
				ctx.replace(rendered);
			} catch (e) {
				console.error(`Failed to render component ${viewPath}`, e);
				// If we have the error rendering helper, use it, otherwise show simple error
				if (typeof (ctx.kire as any).renderError === 'function') {
                    // We assume this might be returned to client or just logged
                    // ctx.replace((ctx.kire as any).renderError(e)); 
                    // But usually we don't want to replace the component with a full HTML page.
                    ctx.replace(`<!-- Error rendering ${viewPath}: ${(e as any).message} -->`);
                } else {
                     ctx.replace(`<!-- Error rendering ${viewPath}: ${(e as any).message} -->`);
                }
			}
		});

		// Reactive Props Logic (SupportReactiveProps equivalent)
		// This part is tricky because it depends on how "wire" components interact with these "blade" components.
		// If these are just static views, reactive props are just passed data.
		// The prompt mentions "SupportReactiveProps.php" from Livewire, which implies
		// passing data *down* from a parent Livewire component to a child component (which might be another Livewire component or just a view).
		
		// If this is strictly for the "View Component" pattern (like Blade components), data passing is immediate.
		// The "reactive" part usually applies when the Parent updates, the Child prop should update.
		// In Kire (SSR/Backend), "reactive" means if the parent re-renders, the child re-renders with new props.
		// Since we handle <x-tag> by replacing it with kire.view() output *during* the parent's render pass,
		// "reactivity" (updates) happens naturally on every re-render of the parent.

		// However, if the user specifically asked for "SupportReactiveProps" like Livewire,
		// they might be dealing with "Wire" components nested inside these <x-> components,
		// or passing "wire:model" down.
		
		// If we are in a Wire context, we might need to ensure that props passed to <x-child :prop="$val" />
		// are correctly handled. 
        // But since this is a server-side render, standard variable passing works.
        
        // We will stick to the basic "Component as View" implementation first, which fulfills the "<x-counter/> becomes @include components.counter" requirement.
	}
}

export default new KireComponents();
