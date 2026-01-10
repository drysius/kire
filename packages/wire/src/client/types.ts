import type { KireWireClient } from "./client";

declare global {
	interface Window {
		KireWire: KireWireClient;
		__KIREWIRE_CONFIG__: ClientConfig;
	}
}

export interface ClientConfig {
	endpoint: string;
	method?: "http" | "socket";
	csrf?: string;
	[key: string]: any;
}

export interface WireRequest {
	component: string;
	snapshot: string;
	method: string;
	params: any[];
	updates?: Record<string, any>;
    _token?: string;
}

export interface WireResponse {
    components: Array<{
        snapshot: string;
        effects: {
            html: string;
            returns?: unknown[];
            dirty?: string[];
            emits?: Array<{ event: string; params: any[] }>;
            redirect?: string;
            errors?: Record<string, string>;
        };
    }>;
    error?: string;
}
