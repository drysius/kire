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
    url?: string;
}

export interface WireStream {
    target: string;
    content: string;
    replace?: boolean;
    method?: 'update' | 'append' | 'prepend' | 'remove';
}
