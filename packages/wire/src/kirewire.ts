import { randomUUID } from "node:crypto";
import type { Kire } from "kire";
import type { LiveComponent } from "./component";
import type {
	Broadcaster,
	ComponentRequest,
	ComponentResponse,
	Effects,
	Snapshot,
	SnapshotMemo,
	UpdateRequest,
	UpdateResponse,
} from "./contracts";
import { PROTOCOL_VERSION } from "./contracts";
import type { FeatureBus } from "./features/feature";
import { createDefaultFeatures } from "./features/index";
import { resolveMeta } from "./metadata";
import { type ComponentClass, ComponentRegistry } from "./registry";
import { verify } from "./runtime/checksum";
import { RequestContext } from "./runtime/context";
import { setDeep } from "./runtime/properties";
import { hydrateData, takeSnapshot } from "./runtime/snapshot";
import { createDefaultSynthRegistry } from "./synth/builtins";
import type { SynthRegistry } from "./synth/registry";

export interface KirewireOptions {
	/** HMAC secret for snapshot checksums. Required; keep it stable per app. */
	secret: string;
	synth?: SynthRegistry;
	registry?: ComponentRegistry;
	features?: FeatureBus;
	/** Optional push channel for `component.$broadcast(channel, effects)`. */
	broadcaster?: Broadcaster;
}

/**
 * Serialize a snapshot for a single-quoted HTML attribute. Escape `&` BEFORE `'`
 * so that user data containing literal `&#39;` cannot decode back into a quote and
 * break out of the attribute (entity-injection XSS).
 */
export function serializeSnapshotAttr(snapshot: Snapshot): string {
	return JSON.stringify(snapshot).replace(/&/g, "&amp;").replace(/'/g, "&#39;");
}

/** Inject attributes into the first opening tag of a single-root HTML fragment. */
export function injectRootAttributes(html: string, attr: string): string {
	const match = html.match(/^\s*<[a-zA-Z][^\s/>]*/);
	if (!match) return `<div${attr}>${html}</div>`;
	const at = match[0].length;
	return html.slice(0, at) + attr + html.slice(at);
}

/** Thrown when an incoming snapshot fails checksum verification. */
export class CorruptSnapshotError extends Error {
	constructor() {
		super("Component snapshot failed verification.");
		this.name = "CorruptSnapshotError";
	}
}

/**
 * Server-side orchestrator: registers components and features, mounts components
 * for SSR, and runs the update pipeline for incoming requests. Transport-agnostic
 * — adapters translate native HTTP/SSE/WS into {@link UpdateRequest}.
 */
export class Kirewire {
	readonly secret: string;
	readonly synth: SynthRegistry;
	readonly registry: ComponentRegistry;
	readonly features: FeatureBus;
	readonly broadcaster?: Broadcaster;

	constructor(opts: KirewireOptions) {
		if (!opts.secret) throw new Error("Kirewire requires a `secret`.");
		this.secret = opts.secret;
		this.synth = opts.synth ?? createDefaultSynthRegistry();
		this.registry = opts.registry ?? new ComponentRegistry();
		this.features = opts.features ?? createDefaultFeatures();
		this.broadcaster = opts.broadcaster;
	}

	/** Attach the runtime's `$broadcast` helper to a component instance. */
	private wireBroadcast(instance: LiveComponent): void {
		if (!this.broadcaster) return;
		instance.$broadcast = (channel: string, effects: Effects) =>
			this.broadcaster!.publish({ v: PROTOCOL_VERSION, channel, effects });
	}

	/** Register a component class (name from `@Component`) or under an explicit name. */
	component(ctorOrName: ComponentClass | string, ctor?: ComponentClass): this {
		if (typeof ctorOrName === "string")
			this.registry.register(ctorOrName, ctor!);
		else this.registry.registerClass(ctorOrName);
		return this;
	}

	// ── Mount (initial SSR) ────────────────────────────────────────────────────

	/** Instantiate, mount, render, and snapshot a component for first paint. */
	async mount(
		name: string,
		params: Record<string, unknown> = {},
		engine?: Kire<boolean>,
	): Promise<{ id: string; snapshot: Snapshot; html: string }> {
		const instance = this.registry.make(name);
		instance.$id = randomUUID();
		instance.$kire = engine;

		const context = new RequestContext(true);
		instance.$context = context;
		this.wireBroadcast(instance);

		this.features.boot(instance);
		// Plain public params seed matching properties before mount().
		for (const [key, value] of Object.entries(params)) {
			if (!instance.isInternalKey(key))
				(instance as unknown as Record<string, unknown>)[key] = value;
		}
		this.features.mount(instance, params);

		// A feature (e.g. lazy loading) may supply placeholder HTML to skip render.
		const html =
			context.html !== undefined
				? context.html
				: await this.renderComponent(instance, context);
		const snapshot = this.dehydrate(
			instance,
			context,
			this.freshMemo(instance),
		);
		return { id: instance.$id, snapshot, html };
	}

	// ── Update (subsequent requests) ───────────────────────────────────────────

	/** Run the full update pipeline for one component request. */
	async update(
		req: ComponentRequest,
		engine?: Kire<boolean>,
	): Promise<ComponentResponse> {
		const snapshot: Snapshot =
			typeof req.snapshot === "string"
				? JSON.parse(req.snapshot)
				: req.snapshot;

		if (!verify(snapshot, this.secret)) throw new CorruptSnapshotError();

		const instance = this.registry.make(snapshot.memo.name);
		instance.$id = snapshot.memo.id;
		instance.$kire = engine;

		const context = new RequestContext(false);
		instance.$context = context;
		this.wireBroadcast(instance);

		// 1. Hydrate state from the snapshot.
		const data = hydrateData(snapshot.data, this.synth);
		for (const [key, value] of Object.entries(data)) {
			(instance as unknown as Record<string, unknown>)[key] = value;
		}
		this.features.boot(instance);
		this.features.hydrate(instance, snapshot.memo);

		// 2. Apply property updates (wire:model / $set).
		for (const [path, value] of Object.entries(req.updates)) {
			const finishers = this.features.update(instance, path, value);
			setDeep(instance as unknown as Record<string, unknown>, path, value);
			for (const fin of finishers) fin(value);
		}

		// 3. Invoke method calls (actions).
		for (const call of req.calls) {
			const early = this.features.call(instance, call);
			let ret: unknown;
			if (early) {
				ret = early.earlyReturn;
			} else if (instance.isCallableAction(call.method)) {
				const fn = (
					instance as unknown as Record<string, (...a: unknown[]) => unknown>
				)[call.method]!;
				ret = await fn.apply(instance, call.params);
			} else {
				throw new Error(
					`Method "${call.method}" is not callable on "${snapshot.memo.name}".`,
				);
			}
			context.returns.push(ret);
			if (
				call.meta?.renderless ||
				resolveMeta(instance).renderless.has(call.method)
			) {
				context.skipRender = true;
			}
		}

		// 4. Render (unless renderless).
		if (!context.skipRender) {
			context.html = await this.renderComponent(instance, context);
		}

		// 5. Dehydrate -> fresh signed snapshot + effects.
		const memo = {
			...snapshot.memo,
			...this.freshMemo(instance),
		} as SnapshotMemo;
		const next = this.dehydrate(instance, context, memo);
		return { id: instance.$id, snapshot: next, effects: context.finalize() };
	}

	/** Handle a batched request of many components in one round-trip. */
	async handle(
		req: UpdateRequest,
		engine?: Kire<boolean>,
	): Promise<UpdateResponse> {
		const components = await Promise.all(
			req.components.map((c) => this.update(c, engine)),
		);
		return { v: PROTOCOL_VERSION, components };
	}

	/**
	 * Mount a component and return its HTML with the `wire:*` SSR attributes
	 * injected into the root element. Called from the `@wire` directive at render
	 * time; `engine` is the request-scoped Kire fork rendering the parent template.
	 */
	async renderMount(
		engine: Kire<boolean>,
		name: string,
		params: Record<string, unknown> = {},
	): Promise<string> {
		const { id, snapshot, html } = await this.mount(name, params, engine);
		const attr =
			` wire:id="${id}" wire:name="${name}"` +
			` wire:snapshot='${serializeSnapshotAttr(snapshot)}'`;
		return injectRootAttributes(html, attr);
	}

	// ── Internals ──────────────────────────────────────────────────────────────

	private async renderComponent(
		instance: LiveComponent,
		context: RequestContext,
	): Promise<string> {
		const finishers = this.features.render(instance, context);
		const html = await instance.render();
		for (const fin of finishers) fin(html);
		return html;
	}

	private dehydrate(
		instance: LiveComponent,
		context: RequestContext,
		memo: SnapshotMemo,
	): Snapshot {
		this.features.dehydrate(instance, context);
		const fullMemo = { ...memo, ...context.memo } as SnapshotMemo;
		return takeSnapshot(
			instance.getPublicState(),
			fullMemo,
			this.synth,
			this.secret,
		);
	}

	private freshMemo(instance: LiveComponent): SnapshotMemo {
		const meta = resolveMeta(instance);
		const memo: SnapshotMemo = { id: instance.$id, name: instance.$name };
		if (meta.listeners.size)
			memo.listeners = Object.fromEntries(meta.listeners);
		return memo;
	}
}
