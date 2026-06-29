import type { LiveComponent } from "../component";
import type { ComponentCall } from "../contracts";
import { getDeep, setDeep } from "../runtime/properties";
import { Feature } from "./feature";

/**
 * Built-in `$`-prefixed actions the client can call without a matching component
 * method: `$refresh` (re-render only), `$set` (write a property), `$toggle`
 * (flip a boolean). Intercepted before the normal action lookup, so the reserved
 * `$` prefix never blocks them.
 */
export class MagicFeature extends Feature {
	override call(
		c: LiveComponent,
		call: ComponentCall,
	): { earlyReturn: unknown } | void {
		const target = c as unknown as Record<string, unknown>;
		switch (call.method) {
			case "$refresh":
				return { earlyReturn: null };
			case "$set": {
				const [path, value] = call.params as [string, unknown];
				setDeep(target, path, value);
				return { earlyReturn: getDeep(target, path) };
			}
			case "$toggle": {
				const [path] = call.params as [string];
				setDeep(target, path, !getDeep(target, path));
				return { earlyReturn: getDeep(target, path) };
			}
			default:
				return undefined;
		}
	}
}
