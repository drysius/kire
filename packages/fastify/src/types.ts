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
	 * Enable the duplex WebSocket transport (via `@fastify/websocket`). `true`
	 * uses the default path `/_wire/ws`; an object customizes it. Fastify owns its
	 * server, so this works directly when declared — just install
	 * `@fastify/websocket`. The injected client script connects over WebSocket.
	 */
	ws?: boolean | WireWsOptions;
}

export interface KireFastifyOptions {
	views: string;
	extension?: string;
	production?: boolean;
	engine?: Kire<boolean>;
	plugins?: PluginEntry[];
	globals?: Record<string, unknown>;
	wire?: WireIntegration;
}
