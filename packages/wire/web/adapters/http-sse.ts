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

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onUpdate(data);
        } catch (error) {
            console.error("[Wire:SSE] Failed to parse message:", error);
        }
    };

    return () => eventSource.close();
}
