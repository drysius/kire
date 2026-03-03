import type { Kire } from "kire";
import { processWireAction, type WirePayload } from "./http-sse";
import { Component } from "../core/component";
import { WireBroadcast } from "../core/broadcast";

function bindClientSocket(kire: Kire, socket: any) {
    const activeBroadcastBySocket = new WeakMap<object, WireBroadcast>();

    socket.on("wire:action", async (payload: WirePayload, ack?: (result: any) => void) => {
        try {
            const result = await processWireAction(kire, payload);
            if (typeof ack === "function") ack(result);
            socket.emit("wire:response", result);
        } catch (error: any) {
            const err = { id: payload?.id, message: error?.message || "Wire socket error" };
            if (typeof ack === "function") ack({ error: err.message, id: err.id });
            socket.emit("wire:error", err);
        }
    });

    socket.on("wire:broadcast:subscribe", async (payload: any = {}) => {
        try {
            const wire = kire.$kire["~wire"];
            const componentName = String(payload.component || "");
            if (!componentName) {
                socket.emit("wire:broadcast:error", { message: "Missing component" });
                return;
            }

            const ComponentClass = wire?.registry?.get(componentName) as (new () => Component) | undefined;
            if (!ComponentClass) {
                socket.emit("wire:broadcast:error", { message: "Component not found" });
                return;
            }

            const room = String(payload.channel || "global");
            const password = payload.password != null ? String(payload.password) : undefined;
            const instance = new ComponentClass();
            instance._setKire(kire);
            instance.__name = componentName;
            instance.__id = String(payload.id || `socket_${Math.random().toString(36).slice(2)}`);
            await instance.mount(payload || {});
            await instance.hydrate();

            const broadcasters = Object.values(instance as any).filter((x: any) => x instanceof WireBroadcast) as WireBroadcast[];
            const selected = broadcasters.find((b: any) => (b as any).options?.name === room) || broadcasters[0];
            if (!selected) {
                socket.emit("wire:broadcast:error", { message: "No WireBroadcast found in component" });
                return;
            }
            if (!selected.verifyPassword(password)) {
                socket.emit("wire:broadcast:error", { message: "Invalid broadcast password" });
                return;
            }

            const prev = activeBroadcastBySocket.get(socket as object);
            if (prev) prev.disconnectSocket(socket);

            selected.hydrate(instance, room);
            selected.connectSocket(socket);
            activeBroadcastBySocket.set(socket as object, selected);
            socket.emit("wire:broadcast:connected", {
                type: "wire:broadcast:connected",
                channel: selected.getChannel(),
                component: componentName,
                connections: selected.connections
            });
        } catch (error: any) {
            socket.emit("wire:broadcast:error", { message: error?.message || "Subscribe failed" });
        }
    });

    socket.on("wire:broadcast:unsubscribe", () => {
        const active = activeBroadcastBySocket.get(socket as object);
        if (active) {
            active.disconnectSocket(socket);
            activeBroadcastBySocket.delete(socket as object);
        }
    });

    socket.on("disconnect", () => {
        const active = activeBroadcastBySocket.get(socket as object);
        if (active) {
            active.disconnectSocket(socket);
            activeBroadcastBySocket.delete(socket as object);
        }
    });
}

export function setupSocketAdapter(kire: Kire, socketOrServer: any) {
    if (!socketOrServer) return;

    // socket.io server style
    if (typeof socketOrServer.on === "function" && typeof socketOrServer.emit === "function") {
        // If it looks like a server (has namespace/adapter markers), bind per connection.
        if (typeof socketOrServer.of === "function" || socketOrServer.sockets) {
            socketOrServer.on("connection", (client: any) => bindClientSocket(kire, client));
            return;
        }
    }

    // raw socket instance
    bindClientSocket(kire, socketOrServer);
}
