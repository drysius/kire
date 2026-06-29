import { FeatureBus } from "./feature";
import { LifecycleFeature } from "./lifecycle";
import { LockedFeature } from "./locked";
import { ValidationFeature } from "./validation";
import { MagicFeature } from "./magic";
import { LazyFeature } from "./lazy";
import { UrlFeature } from "./url";

export { Feature, FeatureBus, type Finisher } from "./feature";
export { LifecycleFeature } from "./lifecycle";
export { LockedFeature, LockedPropertyError } from "./locked";
export { ValidationFeature, type Rule } from "./validation";
export { MagicFeature } from "./magic";
export { LazyFeature } from "./lazy";
export { UrlFeature } from "./url";

/**
 * A feature bus preloaded with the v1 essential features. Order matters:
 * `Lazy` runs before `Lifecycle` so it can defer `mount()`; `Locked` rejects
 * forbidden writes before any update hook; `Magic` intercepts `$`-actions before
 * normal method dispatch.
 */
export function createDefaultFeatures(): FeatureBus {
	return new FeatureBus()
		.register(new LazyFeature())
		.register(new LockedFeature())
		.register(new ValidationFeature())
		.register(new LifecycleFeature())
		.register(new UrlFeature())
		.register(new MagicFeature());
}
