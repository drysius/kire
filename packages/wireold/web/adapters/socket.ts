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

function resolveSocket(): any {
    const cfg = (window as any).__WIRE_CONFIG__ || {};
    if (cfg.socket) return cfg.socket;
    if ((window as any).__WIRE_SOCKET__) return (window as any).__WIRE_SOCKET__;
    return null;
}

export function requestSocketAction(payload: any): Promise<any> {
    const socket = resolveSocket();
    if (!socket || typeof socket.emit !== "function") {
        return Promise.reject(new Error("[Wire:Socket] Missing socket instance. Set window.__WIRE_SOCKET__ or Wire.start({ socket })."));
    }

    return new Promise((resolve, reject) => {
        let done = false;
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("[Wire:Socket] Action timeout"));
        }, 15000);

        const off = (event: string, handler: (...args: any[]) => void) => {
            if (typeof socket.off === "function") socket.off(event, handler);
            else if (typeof socket.removeListener === "function") socket.removeListener(event, handler);
            else if (typeof socket.removeEventListener === "function") socket.removeEventListener(event, handler);
        };

        const cleanup = () => {
            if (done) return;
            done = true;
            clearTimeout(timeout);
            off("wire:response", onResponse);
            off("wire:error", onError);
        };

        const onResponse = (result: any) => {
            if (!result || String(result.id || "") !== String(payload.id || "")) return;
            cleanup();
            resolve(result);
        };

        const onError = (err: any) => {
            if (err?.id && String(err.id) !== String(payload.id || "")) return;
            cleanup();
            reject(new Error(err?.message || "Socket action error"));
        };

        socket.on("wire:response", onResponse);
        socket.on("wire:error", onError);
        socket.emit("wire:action", payload);
    });
}

export function connectSocketBroadcast(
    target: string | { component: string; id: string; channel?: string; password?: string },
    onUpdate: (data: any) => void
) {
    const socket = resolveSocket();
    if (!socket || typeof socket.emit !== "function") {
        console.warn("[Wire] Socket adapter selected, but no socket instance available. Falling back to SSE is recommended.");
        return () => {};
    }

    const payload = typeof target === "string"
        ? { component: "", id: "", channel: target || "global" }
        : {
            component: String(target.component),
            id: String(target.id),
            channel: String(target.channel || "global"),
            password: target.password != null ? String(target.password) : undefined
        };

    const forward = (msg: any) => onUpdate(msg);
    const events = [
        "wire:broadcast:connected",
        "wire:broadcast:snapshot",
        "wire:broadcast:update",
        "wire:broadcast:error",
    ];
    events.forEach((event) => socket.on(event, forward));
    socket.emit("wire:broadcast:subscribe", payload);

    return () => {
        try {
            socket.emit("wire:broadcast:unsubscribe", payload);
        } catch {}
        for (const event of events) {
            if (typeof socket.off === "function") socket.off(event, forward);
            else if (typeof socket.removeListener === "function") socket.removeListener(event, forward);
        }
    };
}
