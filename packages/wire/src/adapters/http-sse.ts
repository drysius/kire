import type { Kire } from "kire";
import { FileUpload } from "../core/upload";
import { WireBroadcast } from "../core/broadcast";

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

const FORBIDDEN_METHODS = new Set([
    "constructor",
    "mount",
    "hydrate",
    "updating",
    "updated",
    "rendering",
    "rendered",
    "render",
    "fill",
    "validate",
    "addError",
    "clearErrors",
    "emit",
    "stream",
    "redirect",
    "rule",
    "_setKire",
    "_getEffects",
    "getPublicProperties",
    "getDataForRender",
    "onUpdateState"
]);

function isCallableAction(instance: any, methodName: string): boolean {
    if (!methodName || methodName === "$refresh") return true;
    if (methodName.startsWith("_")) return false;
    if (methodName.startsWith("$")) return false;
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(methodName)) return false;
    if (FORBIDDEN_METHODS.has(methodName)) return false;
    return typeof instance?.[methodName] === "function";
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
        if (!wire.checksum.verify(payload.checksum, payload.state, wireKey, { id: payload.id, component: payload.component })) {
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
    const broadcasts = Object.values(instance as any).filter((x: any) => x instanceof WireBroadcast) as WireBroadcast[];
    broadcasts.forEach((b) => b.hydrate(instance));

    // 2. Incremental updates (wire:model)
    if (payload.updates) {
        for (const [prop, val] of Object.entries(payload.updates)) {
            if (prop in instance && !prop.startsWith("__")) {
                const current = (instance as any)[prop];
                await instance.updating(prop, val);
                if (current instanceof FileUpload) {
                    const files = (val as any)?._wire_type === "WireFile"
                        ? (val as any).files
                        : (Array.isArray(val) ? val : [val]);
                    instance.clearErrors(prop);
                    await current.populate(files.filter(Boolean), instance, prop);
                } else {
                    (instance as any)[prop] = val;
                    instance.clearErrors(prop);
                }
                // Updated hook is called via Proxy
            }
        }
    }

    // 3. Execution
    if (payload.method && payload.method !== "$refresh") {
        if (!isCallableAction(instance, payload.method)) {
            throw new Error(`Security Violation: Method "${payload.method}" is not callable.`);
        }
        const method = (instance as any)[payload.method];
        if (typeof method === "function") {
            await method.apply(instance, payload.params || []);
        }
    }

    // 4. Finalizing
    await instance.rendering();
    const html = await instance.render();
    await instance.rendered();

    const state = instance.getPublicProperties();
    const effects = instance._getEffects();
    const newChecksum = wire.checksum.generate(state, wireKey, { id: instance.__id, component: instance.__name });
    const listenersStr = JSON.stringify(instance.listeners || {}).replace(/"/g, '&quot;');
    const stateStr = JSON.stringify(state).replace(/"/g, '&quot;');
    const wrappedHtml = `<div wire:id="${instance.__id}" wire:component="${instance.__name}" wire:state="${stateStr}" wire:checksum="${newChecksum}" wire:listeners="${listenersStr}">${html}</div>`;

    return {
        id: instance.__id,
        html: wrappedHtml,
        state,
        checksum: newChecksum,
        effects
    };
}
