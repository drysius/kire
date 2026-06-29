/**
 * Kirewire — server-driven reactive components for Kire.
 */

// Framework adapters
export {
	createFetchHandler,
	type ExpressAdapterOptions,
	expressAdapter,
	type FetchAdapterOptions,
} from "./adapters/index";

// Components & runtime
export { LiveComponent } from "./component";
export * from "./contracts";
// Decorators
export {
	action,
	Component,
	computed,
	lazy,
	locked,
	on,
	prop,
	renderless,
	url,
	validate,
} from "./decorators";
export {
	type FileStore,
	FileUploadFeature,
	FileUploadSynth,
	fileToken,
	handleUpload,
	MemoryFileStore,
	type StoredFile,
	type UploadInput,
	WireFile,
} from "./features/file-upload";
export { FormValidationError, WireForm } from "./features/form";

// Features
export {
	createDefaultFeatures,
	Feature,
	FeatureBus,
	type Finisher,
	LazyFeature,
	LifecycleFeature,
	LockedFeature,
	LockedPropertyError,
	MagicFeature,
	type Rule,
	UrlFeature,
	ValidationFeature,
} from "./features/index";
export { type Page, paginate } from "./features/pagination";
// Kire integration
export { type KirewirePluginOptions, kirewirePlugin } from "./kire/plugin";
export {
	CorruptSnapshotError,
	Kirewire,
	type KirewireOptions,
} from "./kirewire";
export { type ComponentMeta, ownMeta, resolveMeta } from "./metadata";
export { type ComponentClass, ComponentRegistry } from "./registry";
// Snapshot primitives
export { sign, verify } from "./runtime/checksum";
export { RequestContext } from "./runtime/context";
export { getDeep, setDeep } from "./runtime/properties";
export { dehydrateData, hydrateData, takeSnapshot } from "./runtime/snapshot";
export { store } from "./runtime/store";

// Server transport (HTTP / SSE / WebSocket + broadcast hub)
export {
	type HttpResult,
	Hub,
	handleUpdate,
	nodeHttpAdapter,
	type PushSubscriber,
	SSE_HEADERS,
	type SseConnection,
	serveSse,
	serveWs,
	type WsConnection,
	type WsOptions,
} from "./server/index";
export { createDefaultSynthRegistry } from "./synth/builtins";
export { defineSynth, modelSynth } from "./synth/class";
export { SynthRegistry } from "./synth/registry";
// Synthesizers
export { type PartialMeta, Synth, type SynthChild } from "./synth/synth";
