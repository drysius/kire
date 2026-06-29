import { PROTOCOL_VERSION, type Dispatch, type Snapshot, type Transport } from "../contracts";
import { ClientComponent } from "./component";
import { makeWire, type Wire } from "./wire";
import type { DirectiveRegistry } from "./directives";

interface PendingCall {
	method: string;
	params: unknown[];
	resolve: (value: unknown) => void;
	reject: (error: unknown) => void;
}

interface PendingEntry {
	component: ClientComponent;
	calls: PendingCall[];
}

export interface WireRuntimeOptions {
	transport: Transport;
	directives: DirectiveRegistry;
	/** Microtask buffer (ms) for batching synchronous interactions. */
	buffer?: number;
}

/**
 * The client orchestrator: discovers components in the DOM, binds directives,
 * batches property updates and action calls into pooled requests, and applies
 * responses (snapshot adoption, DOM morph, dispatches).
 */
export class WireRuntime {
	readonly components = new Map<string, ClientComponent>();
	private readonly wires = new WeakMap<ClientComponent, Wire>();
	private readonly transport: Transport;
	private readonly directives: DirectiveRegistry;
	private readonly buffer: number;
	private readonly pending = new Map<string, PendingEntry>();
	private timer: ReturnType<typeof setTimeout> | null = null;

	constructor(opts: WireRuntimeOptions) {
		this.transport = opts.transport;
		this.directives = opts.directives;
		this.buffer = opts.buffer ?? 5;
	}

	/** Scan the document and mount every top-level component. */
	start(root: ParentNode = document): void {
		const candidates = Array.from(root.querySelectorAll("*")).filter((el) =>
			el.hasAttribute("wire:snapshot"),
		);
		for (const el of candidates) {
			let parent = el.parentElement;
			let nested = false;
			while (parent) {
				if (parent.hasAttribute("wire:snapshot")) {
					nested = true;
					break;
				}
				parent = parent.parentElement;
			}
			if (!nested) this.mount(el);
		}
	}

	/** Mount a single element bearing a `wire:snapshot`. */
	mount(el: Element): ClientComponent | undefined {
		const raw = el.getAttribute("wire:snapshot");
		if (!raw) return undefined;
		const snapshot = JSON.parse(raw) as Snapshot;
		const component = new ClientComponent(el, snapshot, this);
		this.components.set(component.id, component);
		this.bind(component);
		return component;
	}

	/** The `$wire` object for a component (cached). */
	wireFor(component: ClientComponent): Wire {
		let wire = this.wires.get(component);
		if (!wire) {
			wire = makeWire(component, this);
			this.wires.set(component, wire);
		}
		return wire;
	}

	/** (Re)bind directives over a component's element subtree. */
	bind(component: ClientComponent): void {
		this.directives.apply(component, this.wireFor(component), this);
	}

	// ── Pool ─────────────────────────────────────────────────────────────────

	commit(component: ClientComponent): void {
		this.entry(component);
		this.schedule();
	}

	queueCall(component: ClientComponent, method: string, params: unknown[]): Promise<unknown> {
		const entry = this.entry(component);
		return new Promise((resolve, reject) => {
			entry.calls.push({ method, params, resolve, reject });
			this.schedule();
		});
	}

	private entry(component: ClientComponent): PendingEntry {
		let entry = this.pending.get(component.id);
		if (!entry) {
			entry = { component, calls: [] };
			this.pending.set(component.id, entry);
		}
		return entry;
	}

	private schedule(): void {
		if (this.timer) return;
		this.timer = setTimeout(() => void this.flush(), this.buffer);
	}

	/** Send all buffered work as one batched request and apply the response. */
	async flush(): Promise<void> {
		this.timer = null;
		const entries = [...this.pending.values()];
		this.pending.clear();
		if (entries.length === 0) return;

		const request = {
			v: PROTOCOL_VERSION,
			components: entries.map((e) => ({
				snapshot: e.component.snapshot,
				updates: e.component.takeUpdates(),
				calls: e.calls.map((c) => ({ method: c.method, params: c.params })),
			})),
		};

		this.emitLoading(entries, true);
		let response;
		try {
			response = await this.transport.send(request);
		} catch (error) {
			for (const e of entries) for (const c of e.calls) c.reject(error);
			throw error;
		} finally {
			this.emitLoading(entries, false);
		}

		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i]!;
			const rc = response.components[i];
			if (!rc || "skip" in rc) {
				for (const c of entry.calls) c.resolve(undefined);
				continue;
			}
			const component = this.components.get(rc.id) ?? entry.component;
			component.applyResponse(rc.snapshot, rc.effects);
			const returns = rc.effects.returns ?? [];
			entry.calls.forEach((c, j) => c.resolve(returns[j]));
		}
	}

	// ── Effects ──────────────────────────────────────────────────────────────

	dispatch(d: { event: string; params: unknown[]; to?: string; self?: boolean }, from?: ClientComponent): void {
		const dispatch = d as Dispatch;
		for (const component of this.components.values()) {
			if (dispatch.to && component.name !== dispatch.to) continue;
			if (dispatch.self && component !== from) continue;
			const method = component.snapshot.memo.listeners?.[dispatch.event];
			if (method) void component.call(method, dispatch.params);
		}
		if (typeof window !== "undefined") {
			window.dispatchEvent(new CustomEvent(`kirewire:${dispatch.event}`, { detail: dispatch.params }));
		}
	}

	private emitLoading(entries: PendingEntry[], loading: boolean): void {
		if (typeof window === "undefined") return;
		for (const e of entries) {
			window.dispatchEvent(
				new CustomEvent("kirewire:loading", { detail: { id: e.component.id, loading } }),
			);
		}
	}

	runScript(src: string): void {
		try {
			new Function(src)();
		} catch (e) {
			console.error("[kirewire] effect script failed", e);
		}
	}

	redirect(r: { url: string; navigate?: boolean }): void {
		if (typeof window !== "undefined") window.location.assign(r.url);
	}

	/** Patch the URL query string from `@url` properties without navigating. */
	updateUrl(query: Record<string, unknown>): void {
		if (typeof window === "undefined") return;
		const u = new URL(window.location.href);
		for (const [k, v] of Object.entries(query)) {
			if (v === null || v === undefined || v === "") u.searchParams.delete(k);
			else u.searchParams.set(k, String(v));
		}
		window.history.replaceState({}, "", u.toString());
	}
}
