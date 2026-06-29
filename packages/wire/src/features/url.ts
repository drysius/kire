import type { LiveComponent } from "../component";
import { resolveMeta } from "../metadata";
import type { RequestContext } from "../runtime/context";
import { Feature } from "./feature";

/**
 * `@url` properties are mirrored to the page's query string. On dehydrate the
 * feature emits a `url` effect with the current values; the client patches
 * `history` so links/back-button stay in sync. Read-back on first load is the
 * host app's responsibility (pass query params as mount params).
 */
export class UrlFeature extends Feature {
	override skip(c: LiveComponent): boolean {
		return resolveMeta(c).url.size === 0;
	}

	override dehydrate(c: LiveComponent, ctx: RequestContext): void {
		const state = c.getPublicState();
		const query: Record<string, unknown> = {};
		for (const prop of resolveMeta(c).url) query[prop] = state[prop];
		ctx.addEffect("url", { query });
	}
}
