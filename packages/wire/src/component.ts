import type { Kire } from "kire";
import type { RequestContext } from "./runtime/context";
import { resolveMeta } from "./metadata";
import { store } from "./runtime/store";

/** Property/method names that may never be invoked as actions from the client. */
const RESERVED = new Set([
	"constructor",
	"render",
	"view",
	"mount",
	"boot",
	"booted",
	"getPublicState",
	"hydrated",
	"dehydrating",
]);

/**
 * Base class for a reactive component. Subclasses declare public properties
 * (reactive state) and public methods (actions callable from the browser).
 * Framework-internal members use a `$` or `_` prefix and are never serialized or
 * exposed as actions.
 */
export abstract class LiveComponent {
	/** Unique instance id, assigned by the runtime. */
	$id = "";
	/** Registered component name. */
	$name = "";
	/** Request-scoped Kire engine (a fork), set by the pipeline before render. */
	$kire?: Kire<boolean>;
	/** The active request context, available during a request. */
	$context?: RequestContext;

	/** Render the component to HTML. Override, or rely on `view()`. */
	render(): string | Promise<string> {
		return this.view(this.$name);
	}

	/** Queue a client-side event dispatch for after this response is applied. */
	$dispatch(event: string, ...params: unknown[]): void {
		this.$context?.dispatch({ event, params });
	}

	/** Dispatch an event targeted at components of a specific name. */
	$dispatchTo(name: string, event: string, ...params: unknown[]): void {
		this.$context?.dispatch({ event, params, to: name });
	}

	/** Dispatch an event back to only this component. */
	$dispatchSelf(event: string, ...params: unknown[]): void {
		this.$context?.dispatch({ event, params, self: true });
	}

	/** Push effects to all clients subscribed to a channel (set by the runtime). */
	$broadcast?: (channel: string, effects: import("./contracts").Effects) => void;

	/**
	 * Render a Kire view with this component as the local scope. Wired to the
	 * engine in Phase 3; throws if no engine is attached yet.
	 */
	view(path: string, extra: Record<string, unknown> = {}): string | Promise<string> {
		if (!this.$kire) {
			throw new Error(
				`Component "${this.$name}" has no Kire engine attached; cannot render "${path}".`,
			);
		}
		return this.$kire.view(path, {
			...this.getPublicState(),
			...this.computedValues(),
			$errors: store.get(this, "errors", {} as Record<string, string>),
			...extra,
		});
	}

	/** The set of public, serializable properties (own, enumerable, non-prefixed). */
	getPublicState(): Record<string, unknown> {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(this)) {
			if (this.isInternalKey(key)) continue;
			const value = (this as Record<string, unknown>)[key];
			if (typeof value === "function") continue;
			out[key] = value;
		}
		return out;
	}

	/** Snapshot of `@computed` getter values, for injecting into the view scope. */
	computedValues(): Record<string, unknown> {
		const meta = resolveMeta(this);
		const out: Record<string, unknown> = {};
		for (const name of meta.computed) {
			out[name] = (this as Record<string, unknown>)[name];
		}
		return out;
	}

	/** True for `$`/`_`-prefixed keys, which are framework-internal. */
	isInternalKey(key: string): boolean {
		const c = key.charCodeAt(0);
		return c === 36 /* $ */ || c === 95 /* _ */;
	}

	/** Whether `method` may be invoked as an action from the client. */
	isCallableAction(method: string): boolean {
		if (this.isInternalKey(method) || RESERVED.has(method)) return false;
		const fn = (this as Record<string, unknown>)[method];
		if (typeof fn !== "function") return false;
		const meta = resolveMeta(this);
		if (meta.actions.size > 0) return meta.actions.has(method);
		// Only methods defined on a user subclass (not on LiveComponent) are callable.
		return method in this && !(method in LiveComponent.prototype);
	}
}
