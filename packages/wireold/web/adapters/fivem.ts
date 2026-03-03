import { findComponent } from "../store";

/**
 * FiveM Adapter for Wire Client-Side (NUI).
 * Handles communication between NUI and the FiveM client/server scripts.
 */
export function setupFivemClient() {
    // Detect FiveM environment (usually GetParentResourceName is defined in NUI)
    const resourceName = (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : "kire";

    /**
     * Listen for messages from the Client Script (Server -> Client -> NUI).
     * This processes responses that were triggered asynchronously.
     */
    window.addEventListener("message", (event) => {
        const data = event.data;
        
        // Match the specific message type for Wire responses
        if (data && data.type === `${resourceName}:wire:response`) {
            const result = data.payload || data.response;
            if (!result || !result.id) return;

            const component = findComponent(result.id);
            if (component) {
                // Manually trigger the component update with the server response
                if (typeof component._applyResponse === "function") {
                    component._applyResponse(result);
                } else {
                    // Fallback for direct state/html update
                    if (result.state) Object.assign(component, result.state);
                    if (result.html && typeof component.morph === "function") {
                        component.morph(result.html, result.state);
                    }
                }
            }
        }
    });
}

/**
 * Send an action payload to the FiveM client script proxy.
 * This triggers a POST request to the local resource endpoint.
 */
export async function sendFivemAction(payload: any) {
    const resourceName = (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : "kire";
    
    try {
        const response = await fetch(`https://${resourceName}/wire-action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Some FiveM implementations return the result directly via the NUI callback
            return await response.json();
        }
    } catch (error) {
        console.error("[Wire:FiveM] Failed to send action to NUI callback:", error);
    }
    
    return null;
}
