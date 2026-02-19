import type { Kire } from "kire";
import type { WirePayload, WireResponse } from "../types";

/**
 * Optimized Server-side Action Processor.
 * Ensures the component is always wrapped in its metadata container.
 */
export async function processRequest(kire: Kire, payload: WirePayload): Promise<WireResponse> {
    const wire = kire.$kire["~wire"];
    if (!wire) throw new Error("Wire system not initialized");

    const ComponentClass = wire.registry.get(payload.component);
    if (!ComponentClass) throw new Error(`Component "${payload.component}" not found.`);

    const wireKey = (kire as any).$wireKey || "";

    // 1. Verify Checksum
    if (payload.state && payload.checksum) {
        if (!wire.checksum.verify(payload.checksum, payload.state, wireKey)) {
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

    // 3. Apply updates
    if (payload.updates) {
        for (const [prop, val] of Object.entries(payload.updates)) {
            if (prop in instance && !prop.startsWith('__')) {
                await instance.updating(prop, val);
                (instance as any)[prop] = val;
            }
        }
    }

    // 4. Execute Action
    if (payload.method && payload.method !== "$refresh") {
        const method = (instance as any)[payload.method];
        if (typeof method === 'function' && !payload.method.startsWith('__')) {
            await method.apply(instance, payload.params || []);
        }
    }

    // 5. Render & Wrap
    await instance.rendering();
    let html = await instance.render();
    await instance.rendered();

    const finalState = instance.getPublicProperties();
    const newChecksum = wire.checksum.generate(finalState, wireKey);
    const stateStr = JSON.stringify(finalState).replace(/"/g, '&quot;');

    // ENVELOPE THE HTML (Crucial for morph stability)
    const wrappedHtml = `<div wire:id="${instance.__id}" wire:component="${instance.__name}" wire:state="${stateStr}" wire:checksum="${newChecksum}">${html}</div>`;
    
    return {
        id: instance.__id,
        html: wrappedHtml,
        state: finalState,
        checksum: newChecksum,
        effects: instance._getEffects()
    };
}
