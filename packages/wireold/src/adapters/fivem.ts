import type { Kire } from "kire";
import { processWireAction, type WirePayload } from "./http-sse";

/**
 * FiveM Adapter for Wire Server-Side.
 * Listens for network events from clients and processes component actions.
 */
export function setupFivemAdapter(kire: Kire) {
    // Detect if we are in a FiveM environment
    const isFiveM = typeof (global as any).onNet === "function";
    if (!isFiveM) return;

    const resourceName = (global as any).GetCurrentResourceName?.() || "kire";

    /**
     * Listen for actions triggered by client-side NUI.
     * The client script acts as a proxy: NUI -> Client Script -> Server Event.
     */
    (global as any).onNet(`${resourceName}:wire:action`, async (payload: WirePayload) => {
        const src = (global as any).source;
        
        try {
            const result = await processWireAction(kire, payload);
            
            /**
             * Send the result back to the specific client.
             * Client script will proxy this back to the NUI.
             */
            (global as any).TriggerClientEvent(`${resourceName}:wire:response`, src, result);
        } catch (error: any) {
            console.error(`[Wire:FiveM] Error processing action for component "${payload.component}":`, error.message);
        }
    });
}
