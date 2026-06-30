import type { Dispatch, Effects, SnapshotMemo } from "../contracts";

/**
 * Carries everything produced while handling one component during a request:
 * the side effects to return to the client, the memo to embed in the next
 * snapshot, and lifecycle control flags. Features write here; the pipeline reads.
 */
export class RequestContext {
	readonly effects: Effects = {};
	readonly memo: Partial<SnapshotMemo> = {};
	/** Method return values, pushed in call order. */
	readonly returns: unknown[] = [];
	/** When true, the component is not re-rendered (renderless calls). */
	skipRender = false;
	/** Pre-rendered HTML to use instead of calling render() (lazy placeholders). */
	html?: string;

	/** True on the very first render (mount), false on subsequent updates. */
	constructor(readonly mounting: boolean) {}

	addEffect(key: string, value: unknown): void {
		this.effects[key] = value as never;
	}

	dispatch(d: Dispatch): void {
		(this.effects.dispatches ??= []).push(d);
	}

	finalize(): Effects {
		if (this.returns.length) this.effects.returns = this.returns;
		if (this.html !== undefined) this.effects.html = this.html;
		return this.effects;
	}
}
