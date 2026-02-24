export interface WireOptions {
    route?: string;
    secret?: string;
    bus_delay?: number; // default 100ms
    cachetime?: string; // default '7d'
    directoryTmp?: string; // default node_modules/.wire-tmp
}

export interface WireSnapshot {
    id: string;
    name: string;
    state: Record<string, any>;
    checksum: string;
}

export interface WirePayload {
    id: string;
    component: string;
    method?: string;
    params?: any[];
    state?: Record<string, any>;
    checksum?: string;
    updates?: Record<string, any>;
    uploads?: string[]; // IDs of uploaded temp files
}

export interface WireBatchRequest {
    _token?: string;
    components: WirePayload[];
}

export interface WireResponse {
    id: string;
    html?: string;
    state?: Record<string, any>;
    checksum?: string;
    effects: WireEffects;
}

export interface WireEffects {
    events: Array<{ name: string; params: any[] }>;
    streams: Array<WireStream>;
    redirect: string | null;
    errors: Record<string, string>;
    listeners?: Record<string, string>;
    url?: string;
    // For navigation/history
    path?: string;
}

export interface WireStream {
    target: string;
    content: string;
    replace?: boolean;
    method?: 'update' | 'append' | 'prepend' | 'remove';
}
