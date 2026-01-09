import type { KireWireClient } from "./client";

declare global {
    interface Window {
        KireWire: KireWireClient;
        __KIREWIRE_CONFIG__: ClientConfig;
    }
}

export interface ClientConfig {
    endpoint: string;
    method?: 'http' | 'socket';
    csrf?: string;
    [key: string]: any;
}

export interface WireRequest {
    component: string;
    snapshot: string;
    method: string;
    params: any[];
}

export interface WireResponse {
    html?: string;
    snapshot?: string;
    updates?: Record<string, any>;
    events?: Array<{ name: string; params: any[] }>;
    redirect?: string;
    error?: string;
}
