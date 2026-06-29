/**
 * Kirewire — server-driven reactive components for Kire.
 */

export * from "./contracts";

// Components & runtime
export { LiveComponent } from "./component";
export { Kirewire, CorruptSnapshotError, type KirewireOptions } from "./kirewire";
export { ComponentRegistry, type ComponentClass } from "./registry";
export { RequestContext } from "./runtime/context";

// Decorators
export {
	Component,
	prop,
	locked,
	computed,
	renderless,
	on,
	validate,
	action,
	lazy,
	url,
} from "./decorators";

// Features
export {
	Feature,
	FeatureBus,
	type Finisher,
	LifecycleFeature,
	LockedFeature,
	LockedPropertyError,
	ValidationFeature,
	type Rule,
	MagicFeature,
	LazyFeature,
	UrlFeature,
	createDefaultFeatures,
} from "./features/index";
export { store } from "./runtime/store";
export { ownMeta, resolveMeta, type ComponentMeta } from "./metadata";

// Synthesizers
export { Synth, type SynthChild, type PartialMeta } from "./synth/synth";
export { SynthRegistry } from "./synth/registry";
export { createDefaultSynthRegistry } from "./synth/builtins";

// Kire integration
export { kirewirePlugin, type KirewirePluginOptions } from "./kire/plugin";

// Server transport (HTTP / SSE / WebSocket + broadcast hub)
export {
	Hub,
	type PushSubscriber,
	handleUpdate,
	nodeHttpAdapter,
	type HttpResult,
	serveSse,
	SSE_HEADERS,
	type SseConnection,
	serveWs,
	type WsConnection,
	type WsOptions,
} from "./server/index";

// Snapshot primitives
export { sign, verify } from "./runtime/checksum";
export { dehydrateData, hydrateData, takeSnapshot } from "./runtime/snapshot";
export { getDeep, setDeep } from "./runtime/properties";
