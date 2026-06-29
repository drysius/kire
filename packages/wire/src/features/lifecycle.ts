import type { LiveComponent } from "../component";
import type { RequestContext } from "../runtime/context";
import { Feature, type Finisher } from "./feature";
import { isLazyDeferred } from "./lazy";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function callIf(target: object, method: string, ...args: unknown[]): void {
	const fn = (target as Record<string, unknown>)[method];
	if (typeof fn === "function") (fn as (...a: unknown[]) => unknown).apply(target, args);
}

/**
 * Bridges the lifecycle to user-defined component methods: `boot`, `mount`,
 * `booted`, `hydrated`, `updating<Prop>`/`updated<Prop>` (and generic
 * `updating`/`updated`), and `rendered`.
 */
export class LifecycleFeature extends Feature {
	override boot(c: LiveComponent): void {
		callIf(c, "boot");
	}

	override mount(c: LiveComponent, params: Record<string, unknown>): void {
		// A lazy component defers mount() until __lazyLoad runs.
		if (isLazyDeferred(c)) return;
		callIf(c, "mount", params);
		callIf(c, "booted");
	}

	override hydrate(c: LiveComponent): void {
		callIf(c, "hydrated");
	}

	override update(c: LiveComponent, path: string, value: unknown): Finisher {
		const root = path.split(".")[0]!;
		callIf(c, `updating${cap(root)}`, value, path);
		callIf(c, "updating", path, value);
		return () => {
			callIf(c, `updated${cap(root)}`, value, path);
			callIf(c, "updated", path, value);
		};
	}

	override render(c: LiveComponent, _ctx: RequestContext): Finisher {
		callIf(c, "rendering");
		return (html) => callIf(c, "rendered", html);
	}
}
