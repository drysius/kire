import { findComponent } from "../store";

/**
 * WebSocket Adapter for Wire Client-Side.
 * Synchronizes component actions over a persistent connection.
 */
export function setupSocketClient(socket: any) {
    /**
     * Listen for server-side responses.
     */
    socket.on("wire:response", (result: any) => {
        if (!result || !result.id) return;

        const component = findComponent(result.id);
        if (component) {
            /**
             * Apply state changes and morph DOM.
             */
            if (typeof component._applyResponse === "function") {
                component._applyResponse(result);
            } else {
                if (result.state) Object.assign(component, result.state);
                if (result.html && typeof component.morph === "function") {
                    component.morph(result.html, result.state);
                }
            }
        }
    });
}

/**
 * Helper to dispatch an action over WebSocket.
 */
export function sendSocketAction(socket: any, payload: any) {
    socket.emit("wire:action", payload);
}
