import type { Kire, KirePlugin } from "kire";

/** A Kire plugin, optionally with its options. */
export type PluginEntry = KirePlugin<any> | [KirePlugin<any>, any];

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
