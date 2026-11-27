import type { Kire, KirePlugin } from "kire";

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

export interface WireIntegration {
	instance: any;
	path?: string;
	scriptUrl?: string;
	clientScript?: string;
	store?: any;
	/**
	 * Enable the duplex WebSocket transport. `true` uses the default path
	 * `/_wire/ws`; an object customizes it. Elysia owns its (Bun) server, so this
	 * works directly when declared — the injected client script connects over
	 * WebSocket via Elysia's native `.ws()`.
	 */
	ws?: boolean | WireWsOptions;
}

export interface KireElysiaOptions {
	views: string;
	extension?: string;
	production?: boolean;
	engine?: Kire<boolean>;
	plugins?: PluginEntry[];
	globals?: Record<string, unknown>;
	wire?: WireIntegration;
	/** Elysia plugin name (default `kire`). */
	name?: string;
}
