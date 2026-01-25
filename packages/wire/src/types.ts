import type { Kire } from "kire";

export interface WiredRequest {
	identifiers: string[];
	token?: string;
	csrftoken?: string;
	payload: any;
	expire: number; // timestamp
	created: number; // timestamp
	renew: () => void;
}

export interface WireOptions {
	components?: string;
	adapter?: "http" | "socket" | "fivem";
	route: string;
	secret?: string;
	csrf?: string;
	expire?: string; // e.g. "10m"
	onPayload?: (wired: WiredRequest) => void;
}

export interface WirePayload {
	component: string;
	snapshot: string; // JSON string containing { data, memo, checksum }
	method?: string;
	id?: string; // Optional ID for lazy loading or initialization
	params?: unknown[];
	updates?: Record<string, unknown>;
	// _token acts as validation but isn't part of the core payload processing logic usually, but good to have
	_token?: string;
}

export interface WireResponse {
	components: Array<{
		snapshot: string; // JSON string
		effects: {
			html: string;
			returns?: unknown[];
			dirty?: string[];
			emits?: Array<{ event: string; params: any[] }>;
			streams?: Array<any>;
			redirect?: string;
			url?: string; // Query String Update
			errors?: Record<string, string>;
			listeners?: Record<string, string>;
		};
	}>;
	error?: string;
}

export interface WireSnapshot {
	data: Record<string, any>;
	memo: {
		id: string;
		name: string;
		path: string;
		method: string;
		children: any[];
		scripts: string[];
		assets: string[];
		errors: any[] | Record<string, any>;
		locale: string;
		[key: string]: any;
	};
	checksum: string;
}

export interface WireContext {
	kire: Kire;
	user?: unknown;
	req?: unknown;
	res?: unknown;
	socket?: unknown;
	[key: string]: unknown;
}
