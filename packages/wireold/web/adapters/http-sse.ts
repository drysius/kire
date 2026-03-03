/**
 * HTTP and SSE Adapter for Wire Client-Side.
 * Handles primary action communication via Fetch and optional push via SSE.
 */

/**
 * Send an action payload to the server via standard HTTP POST.
 */
export async function sendHttpAction(payload: any) {
    const config = (window as any).__WIRE_CONFIG__ || { endpoint: "/_wire" };
    
    const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (response.ok) {
        return await response.json();
    }
    
    throw new Error(`[Wire:HTTP] Action failed with status ${response.status}: ${response.statusText}`);
}

/**
 * Optional: Connect to a Server-Sent Events stream for real-time updates.
 */
export function connectSSE(url: string, onUpdate: (data: any) => void) {
    const eventSource = new EventSource(url);

    const handleEvent = (event: MessageEvent) => {
        try {
            const parsed = JSON.parse(event.data);
            if (parsed && typeof parsed === "object") {
                onUpdate({ type: (parsed as any).type || event.type || "message", ...parsed });
            } else {
                onUpdate({ type: event.type || "message", data: parsed });
            }
        } catch (error) {
            if ((window as any).__WIRE_CONFIG__?.debug) {
                console.debug("[Wire:SSE] non-json message", event.data);
            }
        }
    };

    eventSource.onmessage = handleEvent;
    eventSource.addEventListener("wire:broadcast:connected", handleEvent as EventListener);
    eventSource.addEventListener("wire:broadcast:snapshot", handleEvent as EventListener);
    eventSource.addEventListener("wire:broadcast:update", handleEvent as EventListener);
    eventSource.addEventListener("ping", handleEvent as EventListener);

    eventSource.onerror = () => {
        if ((window as any).__WIRE_CONFIG__?.debug) {
            console.debug("[Wire:SSE] connection error", { url, state: eventSource.readyState });
        }
    };

    return () => eventSource.close();
}
