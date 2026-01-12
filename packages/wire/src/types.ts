import type { Kire } from "kire";

export interface WireOptions {
	components?: string;
	method?: "http" | "socket";
	secret?: string;
	cookiename?: string;
	cookieexpire?: string;
	cookiehttp?: boolean;
	route?: string;
}

export interface WirePayload {
	component: string;
	snapshot: string; // JSON string containing { data, memo, checksum }
	method?: string;
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
			redirect?: string;
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
		errors: any[];
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
