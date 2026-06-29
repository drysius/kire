/**
 * The Kirewire wire protocol — the single source of truth for everything that
 * crosses the network boundary. Server core, client runtime, and every transport
 * adapter speak only these shapes. Keep this file dependency-free.
 */

/** Current protocol version. Bump on any breaking shape change. */
export const PROTOCOL_VERSION = 1 as const;
export type ProtocolVersion = typeof PROTOCOL_VERSION;

// ── Serialized values ───────────────────────────────────────────────────────

/**
 * A value after dehydration. Primitives travel as-is; anything richer travels as
 * a {@link SyntheticTuple} so the other side can reconstruct the original type.
 */
export type Dehydrated =
	| string
	| number
	| boolean
	| null
	| SyntheticTuple
	| Dehydrated[]
	| { [key: string]: Dehydrated };

/**
 * `[value, meta]`. `meta.s` is the synthesizer key used to hydrate the value
 * back into its runtime type (Date, Map, Set, class instance, …). Features may
 * attach extra metadata fields alongside `s`.
 */
export type SyntheticTuple = [value: unknown, meta: SynthMeta];

export interface SynthMeta {
	/** Synthesizer key (short, stable identifier). */
	s: string;
	[key: string]: unknown;
}

// ── Snapshot ────────────────────────────────────────────────────────────────

/**
 * The complete, tamper-evident state of one component instance. The client holds
 * the latest snapshot and echoes it back on every request; the server re-issues a
 * fresh, re-signed snapshot in every response.
 */
export interface Snapshot {
	v: ProtocolVersion;
	/** Dehydrated public properties keyed by property name. */
	data: Record<string, Dehydrated>;
	/** Non-state metadata. Never user-writable; excluded paths are not trusted. */
	memo: SnapshotMemo;
	/** HMAC over {v, data, memo-without-children}. Verified before hydration. */
	checksum: string;
}

export interface SnapshotMemo {
	/** Unique component instance id. */
	id: string;
	/** Registered component name. */
	name: string;
	/** Template/view path, when known. */
	path?: string;
	/**
	 * Child component map: localKey -> [name, id]. Excluded from the checksum so
	 * the client may add/remove children without invalidating the snapshot.
	 */
	children?: Record<string, [name: string, id: string]>;
	/** Dispatched-event name -> handler method this component listens for. */
	listeners?: Record<string, string>;
	/** Features append their own memo fields here. */
	[key: string]: unknown;
}

// ── Request (client -> server) ──────────────────────────────────────────────

export interface ComponentRequest {
	/** The last snapshot the client holds for this component (object or JSON). */
	snapshot: Snapshot | string;
	/** Property writes by dot-path (e.g. `"user.name"`), from wire:model/$set. */
	updates: Record<string, unknown>;
	/** Method invocations to run, in order. */
	calls: ComponentCall[];
}

export interface ComponentCall {
	method: string;
	params: unknown[];
	meta?: { renderless?: boolean };
}

export interface UpdateRequest {
	v: ProtocolVersion;
	/** CSRF / session token, validated by the transport layer. */
	token?: string;
	/** Many components batched into one round-trip. */
	components: ComponentRequest[];
}

// ── Response (server -> client) ─────────────────────────────────────────────

export type ComponentResponse =
	| { id: string; snapshot: Snapshot; effects: Effects }
	/** Reactive child whose inputs did not change — client keeps its DOM. */
	| { id: string; skip: true };

export interface Effects {
	/** Re-rendered component HTML; client morphs this into the DOM. */
	html?: string;
	/** Return values of `calls`, in the same order. */
	returns?: unknown[];
	/** Events to dispatch on the client (and optionally to other components). */
	dispatches?: Dispatch[];
	/** Navigate/redirect after applying the response. */
	redirect?: { url: string; navigate?: boolean };
	/** Inline scripts to execute after morph. */
	scripts?: string[];
	/** Features append their own effect keys here. */
	[key: string]: unknown;
}

export interface Dispatch {
	event: string;
	params: unknown[];
	/** Target a specific component name; omit for self/broadcast semantics. */
	to?: string;
	/** Only dispatch to the originating component. */
	self?: boolean;
}

export interface UpdateResponse {
	v: ProtocolVersion;
	components: ComponentResponse[];
	/** Asset URLs (scripts/styles) the page should ensure are loaded. */
	assets?: string[];
}

// ── Server push (server -> client, unsolicited) ─────────────────────────────

/**
 * A frame pushed from server to client outside the request/response cycle, over
 * SSE or WebSocket. Powers `broadcastTo()` — live dashboards, notifications,
 * collaborative updates. HTTP-only clients receive these via `wire:poll`.
 */
export interface ServerPush {
	v: ProtocolVersion;
	/** Logical channel the client subscribed to (e.g. `"room:42"`). */
	channel: string;
	/** Target a specific component instance id, or omit to fan out by channel. */
	to?: string;
	effects: Effects;
}

// ── Transport interfaces ────────────────────────────────────────────────────

/**
 * Moves protocol frames across the network. Implemented per medium
 * (HTTP, SSE, WebSocket) on the client and mirrored by framework adapters on the
 * server. `subscribe` is optional: HTTP has no push channel.
 */
export interface Transport {
	/** Send a batched update and await the matching response. */
	send(req: UpdateRequest): Promise<UpdateResponse>;
	/** Subscribe to a server-push channel. Returns an unsubscribe function. */
	subscribe?(channel: string, onPush: (push: ServerPush) => void): () => void;
}

/**
 * Server-side fan-out of {@link ServerPush} frames to subscribed clients. A
 * component calls `broadcastTo(channel, effects)`; the configured broadcaster
 * delivers over whatever push transport is active.
 */
export interface Broadcaster {
	publish(push: ServerPush): void | Promise<void>;
}
