import type { Kire, KirePlugin } from "kire";

export type PluginEntry = KirePlugin<any> | [KirePlugin<any>, any];

export interface KireFivemOptions {
	/** Directory that holds the `.kire` NUI views. */
	views: string;
	/** View file extension (default `kire`). */
	extension?: string;
	/** Production mode. */
	production?: boolean;
	/** Use an existing engine instead of creating one from `views`. */
	engine?: Kire<boolean>;
	/** Kire plugins to load. */
	plugins?: PluginEntry[];
	/** Globals exposed to every view. */
	globals?: Record<string, unknown>;
	/** The Kirewire instance that holds component state. */
	wire: {
		instance: any;
		/** NUI callback name the client posts updates to (default `_wire`). */
		path?: string;
		/** URL the NUI page references the client runtime at (default `/kirewire.js`). */
		scriptUrl?: string;
	};
}
