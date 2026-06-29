import type { ComponentCall } from "../contracts";
import type { LiveComponent } from "../component";
import { resolveMeta } from "../metadata";
import { store } from "../runtime/store";
import { Feature } from "./feature";

const DEFER = "lazy:defer";
const PARAMS = "lazy:params";

/**
 * `@lazy` components skip their initial render and emit a tiny placeholder that
 * the client loads (via `wire:init` -> `__lazyLoad`) when it intersects the
 * viewport. The original mount params are stashed in the memo and replayed on load.
 */
export class LazyFeature extends Feature {
	override skip(c: LiveComponent): boolean {
		return !resolveMeta(c).lazy;
	}

	override mount(c: LiveComponent, params: Record<string, unknown>): void {
		const ctx = c.$context!;
		ctx.memo.lazyLoaded = false;
		ctx.memo.lazyParams = params;
		ctx.html = `<div class="wire-lazy" wire:init="$call('__lazyLoad')"></div>`;
		store.set(c, DEFER, true); // tell LifecycleFeature to not run mount() yet
	}

	override hydrate(c: LiveComponent, memo: Record<string, unknown>): void {
		store.set(c, PARAMS, (memo.lazyParams as Record<string, unknown>) ?? {});
	}

	override call(c: LiveComponent, call: ComponentCall): { earlyReturn: unknown } | void {
		if (call.method !== "__lazyLoad") return;
		const params = store.get<Record<string, unknown>>(c, PARAMS, {});
		const target = c as unknown as { mount?: (p: unknown) => void; booted?: () => void };
		target.mount?.(params);
		target.booted?.();
		c.$context!.memo.lazyLoaded = true;
		return { earlyReturn: null };
	}
}

/** Whether the lifecycle should defer `mount()` for a lazy component. */
export function isLazyDeferred(c: LiveComponent): boolean {
	return store.get<boolean>(c, DEFER, false);
}
