import type { Kire, KirePlugin } from "kire";

export type PluginEntry = KirePlugin<any> | [KirePlugin<any>, any];

export interface WireIntegration {
	instance: any;
	path?: string;
	scriptUrl?: string;
	clientScript?: string;
	store?: any;
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
