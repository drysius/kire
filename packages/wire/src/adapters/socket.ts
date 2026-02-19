import type { Kire } from "kire";
import { processWireAction, type WirePayload } from "./http-sse";

/**
 * WebSocket Adapter for Wire Server-Side.
 * Integrates with WebSocket libraries to process component actions.
 */
export function setupSocketAdapter(kire: Kire, socket: any) {
    /**
     * Handle incoming actions from the client.
     */
    socket.on("wire:action", async (payload: WirePayload) => {
        try {
            const result = await processWireAction(kire, payload);
            
            /**
             * Send the result back via the same socket.
             */
            socket.emit("wire:response", result);
        } catch (error: any) {
            console.error(`[Wire:Socket] Error processing action for component "${payload.component}":`, error.message);
            socket.emit("wire:error", { id: payload.id, message: error.message });
        }
    });
}
