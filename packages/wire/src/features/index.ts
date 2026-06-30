import { FeatureBus } from "./feature";
import { LazyFeature } from "./lazy";
import { LifecycleFeature } from "./lifecycle";
import { LockedFeature } from "./locked";
import { MagicFeature } from "./magic";
import { UrlFeature } from "./url";
import { ValidationFeature } from "./validation";

export { Feature, FeatureBus, type Finisher } from "./feature";
export { LazyFeature } from "./lazy";
export { LifecycleFeature } from "./lifecycle";
export { LockedFeature, LockedPropertyError } from "./locked";
export { MagicFeature } from "./magic";
export { UrlFeature } from "./url";
export { type Rule, ValidationFeature } from "./validation";

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
