/**
 * Per-component-class metadata produced by decorators and consumed by features
 * and the pipeline. Stored off to the side (keyed by constructor) so component
 * instances stay clean and serializable.
 */
export interface ComponentMeta {
	/** Registered component name (from `@Component("name")`). */
	name?: string;
	/** Properties declared reactive/client-writable via `@prop`. */
	props: Set<string>;
	/** Properties the client may never write (`@locked`). */
	locked: Set<string>;
	/** Getter names exposed as computed (`@computed`). */
	computed: Set<string>;
	/** Methods that must not trigger a re-render (`@renderless`). */
	renderless: Set<string>;
	/** Dispatched-event name -> handler method (`@on`). */
	listeners: Map<string, string>;
	/** Property -> validation rule/schema (`@validate`). */
	rules: Map<string, unknown>;
	/** Explicit callable-action allowlist; when empty, prototype methods are used. */
	actions: Set<string>;
	/** Properties synced to the URL query string (`@url`). */
	url: Set<string>;
	/** Component defers its initial render until intersected (`@lazy`). */
	lazy?: boolean;
}

const registry = new WeakMap<Function, ComponentMeta>();

function empty(): ComponentMeta {
	return {
		props: new Set(),
		locked: new Set(),
		computed: new Set(),
		renderless: new Set(),
		listeners: new Map(),
		rules: new Map(),
		actions: new Set(),
		url: new Set(),
	};
}

/** Get (creating if needed) the metadata owned by exactly this constructor. */
export function ownMeta(ctor: Function): ComponentMeta {
	let meta = registry.get(ctor);
	if (!meta) {
		meta = empty();
		registry.set(ctor, meta);
	}
	return meta;
}

/** Resolve effective metadata for an instance, merging the prototype chain so a
 * subclass inherits its parents' decorators. */
export function resolveMeta(instance: object): ComponentMeta {
	const chain: ComponentMeta[] = [];
	let ctor: Function | undefined = instance.constructor;
	while (ctor && ctor !== Object) {
		const m = registry.get(ctor);
		if (m) chain.push(m);
		ctor = Object.getPrototypeOf(ctor.prototype)?.constructor;
		if (ctor === ctor?.prototype?.constructor && chain.length > 32) break;
	}
	if (chain.length <= 1) return chain[0] ?? empty();

	const merged = empty();
	for (const m of chain.reverse()) {
		merged.name = m.name ?? merged.name;
		merged.lazy = m.lazy ?? merged.lazy;
		for (const v of m.props) merged.props.add(v);
		for (const v of m.locked) merged.locked.add(v);
		for (const v of m.computed) merged.computed.add(v);
		for (const v of m.renderless) merged.renderless.add(v);
		for (const v of m.actions) merged.actions.add(v);
		for (const v of m.url) merged.url.add(v);
		for (const [k, v] of m.listeners) merged.listeners.set(k, v);
		for (const [k, v] of m.rules) merged.rules.set(k, v);
	}
	return merged;
}
