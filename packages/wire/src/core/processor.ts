import type { Kire } from "kire";
import type { WirePayload, WireResponse } from "../types";
import { FileUpload } from "./upload";
import { WireBroadcast } from "./broadcast";

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
 * Optimized Server-side Action Processor.
 */
export async function processRequest(kire: Kire, payload: WirePayload): Promise<WireResponse> {
    const wire = kire.$kire["~wire"];
    if (!wire) throw new Error("Wire system not initialized");

    const ComponentClass = wire.registry.get(payload.component);
    if (!ComponentClass) throw new Error(`Component "${payload.component}" not found.`);

    const wireKey = (kire as any).$wireKey || "";

    // 1. Verify Checksum
    if (payload.state && payload.checksum) {
        if (!wire.checksum.verify(payload.checksum, payload.state, wireKey, { id: payload.id, component: payload.component })) {
            throw new Error("Security Violation: State checksum mismatch.");
        }
    }

    const instance = new ComponentClass();
    instance._setKire(kire);
    instance.__id = payload.id;
    instance.__name = payload.component;

    // 2. Hydrate
    if (payload.state) instance.fill(payload.state);
    await instance.hydrate();
    const broadcasts = Object.values(instance as any).filter((x: any) => x instanceof WireBroadcast) as WireBroadcast[];
    broadcasts.forEach((b) => b.hydrate(instance));

    // 3. Apply updates
    if (payload.updates) {
        for (const [prop, val] of Object.entries(payload.updates)) {
            if (prop in instance && !prop.startsWith('__')) {
                const current = (instance as any)[prop];
                await instance.updating(prop, val);
                if (current instanceof FileUpload) {
                    const files = (val as any)?._wire_type === "WireFile"
                        ? (val as any).files
                        : (Array.isArray(val) ? val : [val]);
                    instance.clearErrors(prop);
                    await current.populate(files.filter(Boolean), instance, prop);
                } else {
                    if (typeof current === "string" && val && typeof val === "object") {
                        (instance as any)[prop] = "";
                    } else {
                        (instance as any)[prop] = val;
                    }
                    instance.clearErrors(prop);
                }
            }
        }
    }

    // 4. Execute Action
    if (payload.method && payload.method !== "$refresh") {
        if (!isCallableAction(instance, payload.method)) {
            throw new Error(`Security Violation: Method "${payload.method}" is not callable.`);
        }
        const method = (instance as any)[payload.method];
        if (typeof method === 'function') {
            await method.apply(instance, payload.params || []);
        }
    }

    // 5. Render & Wrap
    await instance.rendering();
    let html = await instance.render();
    await instance.rendered();

    const finalState = instance.getPublicProperties();
    const newChecksum = wire.checksum.generate(finalState, wireKey, { id: instance.__id, component: instance.__name });
    const stateStr = JSON.stringify(finalState).replace(/"/g, '&quot;');
    const listenersStr = JSON.stringify(instance.listeners || {}).replace(/"/g, '&quot;');

    // ENVELOPE THE HTML (Ensures stable morphing)
    const wrappedHtml = `<div wire:id="${instance.__id}" wire:component="${instance.__name}" wire:state="${stateStr}" wire:checksum="${newChecksum}" wire:listeners="${listenersStr}">${html}</div>`;
    
    return {
        id: instance.__id,
        html: wrappedHtml,
        state: finalState,
        checksum: newChecksum,
        effects: instance._getEffects()
    };
}
