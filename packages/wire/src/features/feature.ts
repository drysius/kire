import type { ComponentCall } from "../contracts";
import type { LiveComponent } from "../component";
import type { RequestContext } from "../runtime/context";

/** Post-phase callback returned by `update`/`call`/`render` hooks. */
export type Finisher = (result?: unknown) => void;

/**
 * A unit of reactive behavior that intercepts the component lifecycle. Implement
 * only the hooks you need. `update`/`call`/`render` may return a {@link Finisher}
 * that runs after the primary action completes (the "before/after" pattern).
 * `call` may instead return `{ earlyReturn }` to short-circuit a method.
 */
export abstract class Feature {
	/** Skip this feature entirely for a given component (e.g. trait not used). */
	skip?(component: LiveComponent): boolean;

	boot?(component: LiveComponent): void;
	mount?(component: LiveComponent, params: Record<string, unknown>): void;
	hydrate?(component: LiveComponent, memo: Record<string, unknown>): void;
	update?(component: LiveComponent, path: string, value: unknown): void | Finisher;
	call?(
		component: LiveComponent,
		call: ComponentCall,
	): void | { earlyReturn: unknown };
	render?(component: LiveComponent, context: RequestContext): void | Finisher;
	dehydrate?(component: LiveComponent, context: RequestContext): void;
	exception?(component: LiveComponent, error: unknown): void;
}

/** Drives a set of features across the lifecycle, honoring `skip` and finishers. */
export class FeatureBus {
	private readonly features: Feature[] = [];

	register(feature: Feature): this {
		this.features.push(feature);
		return this;
	}

	private active(component: LiveComponent): Feature[] {
		return this.features.filter((f) => !f.skip?.(component));
	}

	boot(component: LiveComponent): void {
		for (const f of this.active(component)) f.boot?.(component);
	}

	mount(component: LiveComponent, params: Record<string, unknown>): void {
		for (const f of this.active(component)) f.mount?.(component, params);
	}

	hydrate(component: LiveComponent, memo: Record<string, unknown>): void {
		for (const f of this.active(component)) f.hydrate?.(component, memo);
	}

	/** Returns finishers to run after the property write lands. */
	update(component: LiveComponent, path: string, value: unknown): Finisher[] {
		const finishers: Finisher[] = [];
		for (const f of this.active(component)) {
			const cb = f.update?.(component, path, value);
			if (cb) finishers.push(cb);
		}
		return finishers;
	}

	/** Returns the first feature-supplied early return, if any. */
	call(component: LiveComponent, call: ComponentCall): { earlyReturn: unknown } | undefined {
		for (const f of this.active(component)) {
			const r = f.call?.(component, call);
			if (r) return r;
		}
		return undefined;
	}

	render(component: LiveComponent, context: RequestContext): Finisher[] {
		const finishers: Finisher[] = [];
		for (const f of this.active(component)) {
			const cb = f.render?.(component, context);
			if (cb) finishers.push(cb);
		}
		return finishers;
	}

	dehydrate(component: LiveComponent, context: RequestContext): void {
		for (const f of this.active(component)) f.dehydrate?.(component, context);
	}

	exception(component: LiveComponent, error: unknown): void {
		for (const f of this.active(component)) f.exception?.(component, error);
	}
}
