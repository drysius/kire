import type { Kire, KirePlugin } from "kire";

/** A Kire plugin, optionally with its options. */
export type PluginEntry = KirePlugin<any> | [KirePlugin<any>, any];

/** WebSocket transport options for the Kirewire integration. */
export interface WireWsOptions {
	/** WebSocket endpoint path (default `/_wire/ws`). */
	path?: string;
	/** Server-push channel the client subscribes to on connect. */
	channel?: string;
	/** Shared Kirewire `Hub` for server pushes (optional; one is created if omitted). */
	hub?: any;
}

/** Optional Kirewire (reactive components) integration. */
export interface WireIntegration {
	/** A Kirewire instance (from `@kirejs/wire`). */
	instance: any;
	/** Update endpoint path (default `/_wire`). */
	path?: string;
	/** URL the client runtime is served/referenced at (default `/kirewire.js`). */
	scriptUrl?: string;
	/** Local file served at `scriptUrl` (e.g. `@kirejs/wire`'s client bundle). */
	clientScript?: string;
	/** Optional file-upload store. */
	store?: any;
	/**
	 * Enable the duplex WebSocket transport. `true` uses the default path
	 * `/_wire/ws`; an object customizes it. Bun owns its server, so this works
	 * directly when declared — pass `kire.websocket` to `Bun.serve` and the
	 * injected client script connects over Bun's native WebSocket.
	 */
	ws?: boolean | WireWsOptions;
}

export interface KireBunOptions {
	/** Directory that holds the `.kire` views. */
	views: string;
	/** View file extension (default `kire`). */
	extension?: string;
	/** Production mode (disables source maps, enables caching). */
	production?: boolean;
	/** Use an existing engine instead of creating one from `views`. */
	engine?: Kire<boolean>;
	/** Kire plugins to load (markdown, i18n, auth, …). */
	plugins?: PluginEntry[];
	/** Globals exposed to every view. */
	globals?: Record<string, unknown>;
	/** Enable Kirewire reactive components. */
	wire?: WireIntegration;
}

/** The handle returned by {@link kireBun}, composed into `Bun.serve`. */
export interface KireBun {
	/** The Kire engine this integration configured. */
	engine: Kire<boolean>;
	/** Render a (dotted) Kire view path and return it as an HTML `Response`. */
	view(name: string, data?: Record<string, unknown>): Promise<Response>;
	/**
	 * Handle the Kirewire endpoints (update POST, client script, WebSocket
	 * upgrade). Returns a `Response` for a wire route, `undefined` when it
	 * performed a WebSocket upgrade (return it from `fetch`), or `null` when the
	 * request is not a wire route (continue with your own routing).
	 */
	wire(req: Request, server?: any): Promise<Response | undefined | null>;
	/**
	 * Bun `websocket` handler, present when `wire.ws` is enabled. Pass it as the
	 * `websocket` option to `Bun.serve`.
	 */
	websocket?: any;
}
