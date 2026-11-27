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
	/**
	 * Node `http.Server` to attach the WebSocket upgrade to. Required for Hono
	 * (the middleware does not own the server): pass the server returned by
	 * `app.listen(...)` or `http.createServer(app)`. Without it WebSocket is
	 * skipped, the client stays on HTTP, and a warning is logged. Needs the `ws`
	 * package installed.
	 */
	server?: any;
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
	 * `/_wire/ws`; an object customizes it. When active, the injected client
	 * script connects over WebSocket instead of HTTP POST.
	 */
	ws?: boolean | WireWsOptions;
}

export interface KireHonoOptions {
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
