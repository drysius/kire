import type { Kire } from "kire";

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
    html: string;
    state: Record<string, any>;
    checksum: string;
    effects: {
        events: Array<{ name: string; params: any[] }>;
        streams: Array<any>;
        redirect: string | null;
        errors: Record<string, string>;
    };
}

/**
 * Enhanced action processor for Wire components.
 */
export async function processWireAction(kire: Kire, payload: WirePayload): Promise<WireResponse> {
    const wire = kire.$kire["~wire"];
    if (!wire) throw new Error("Wire system not initialized");

    const ComponentClass = wire.registry.get(payload.component);
    if (!ComponentClass) {
        throw new Error(`Component "${payload.component}" not found.`);
    }

    const wireKey = (kire as any).$wireKey || "";

    // 1. Validation & Hydration
    if (payload.state && payload.checksum) {
        if (!wire.checksum.verify(payload.checksum, payload.state, wireKey)) {
            throw new Error("Invalid state checksum.");
        }
    }

    const instance = new ComponentClass();
    instance._setKire(kire);
    instance.__id = payload.id;
    instance.__name = payload.component;

    // Mass assignment from state
    if (payload.state) instance.fill(payload.state);
    
    await instance.hydrate();

    // 2. Incremental updates (wire:model)
    if (payload.updates) {
        for (const [prop, val] of Object.entries(payload.updates)) {
            await instance.updating(prop, val);
            (instance as any)[prop] = val;
            // Updated hook is called via Proxy
        }
    }

    // 3. Execution
    if (payload.method && payload.method !== "$refresh") {
        const method = (instance as any)[payload.method];
        if (typeof method === "function" && !payload.method.startsWith("__")) {
            await method.apply(instance, payload.params || []);
        } else if (payload.method === "$set" && payload.params?.length === 2) {
            const [p, v] = payload.params;
            (instance as any)[p] = v;
        }
    }

    // 4. Finalizing
    await instance.rendering();
    const html = await instance.render();
    await instance.rendered();

    const state = instance.getPublicProperties();
    const effects = instance._getEffects();
    const newChecksum = wire.checksum.generate(state, wireKey);

    return {
        id: instance.__id,
        html,
        state,
        checksum: newChecksum,
        effects
    };
}
