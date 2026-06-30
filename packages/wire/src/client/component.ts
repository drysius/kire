import type { Effects, Snapshot } from "../contracts";
import { getDeep, setDeep } from "../runtime/properties";
import { extractData } from "./data";
import { morph } from "./morph";
import { reactive } from "./reactivity";
import type { WireRuntime } from "./runtime";

/**
 * Client mirror of a server component. Holds the canonical snapshot plus a
 * reactive `ephemeral` copy that the UI binds to. Property writes queue an update;
 * actions queue a call; both are flushed to the server in a batched request.
 */
export class ClientComponent {
	readonly id: string;
	readonly name: string;
	el: Element;
	snapshot: Snapshot;
	ephemeral: Record<string, unknown>;
	/** Property writes pending the next commit, keyed by dot-path. */
	readonly updates: Record<string, unknown> = {};

	constructor(
		el: Element,
		snapshot: Snapshot,
		private readonly runtime: WireRuntime,
	) {
		this.el = el;
		this.snapshot = snapshot;
		this.id = snapshot.memo.id;
		this.name = snapshot.memo.name;
		this.ephemeral = reactive(extractData(snapshot.data));
	}

	get(path: string): unknown {
		return getDeep(this.ephemeral, path);
	}

	/** Set a property; `live` commits to the server, otherwise it stays local. */
	set(path: string, value: unknown, live = true): void {
		setDeep(this.ephemeral, path, value);
		this.updates[path] = value;
		if (live) this.runtime.commit(this);
	}

	/** Invoke a server action; resolves with its return value after the response. */
	call(method: string, params: unknown[] = []): Promise<unknown> {
		return this.runtime.queueCall(this, method, params);
	}

	/** Drain pending property updates for inclusion in a request. */
	takeUpdates(): Record<string, unknown> {
		const updates = { ...this.updates };
		for (const k of Object.keys(this.updates)) delete this.updates[k];
		return updates;
	}

	/** Apply a server response: adopt the new snapshot, morph the DOM, run effects. */
	applyResponse(snapshot: Snapshot, effects: Effects): void {
		this.snapshot = snapshot;
		const next = extractData(snapshot.data);
		for (const k of Object.keys(next))
			(this.ephemeral as Record<string, unknown>)[k] = next[k];

		if (typeof effects.html === "string") {
			this.el = morph(this.el, effects.html);
			// Keep the DOM's snapshot current for re-scans/debugging.
			this.el.setAttribute("wire:snapshot", JSON.stringify(snapshot));
			this.runtime.bind(this);
		}
		for (const d of effects.dispatches ?? []) this.runtime.dispatch(d, this);
		for (const src of effects.scripts ?? []) this.runtime.runScript(src);
		if (effects.url)
			this.runtime.updateUrl(
				(effects.url as { query: Record<string, unknown> }).query,
			);
		if (effects.redirect) this.runtime.redirect(effects.redirect);
	}
}
