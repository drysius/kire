import { NullProtoObj } from "kire";
import type { Component } from "./component";

export interface BroadcastOptions {
    name?: string;
    autodelete?: boolean;
    maxconnections?: number;
    excludes?: string[];
    includes?: string[];
}

type BroadcastRoom = {
    name: string;
    state: Record<string, any>;
    components: Set<string>;
    listeners: Set<ReadableStreamDefaultController<string>>;
};

function ensureRooms(wire: any): Map<string, BroadcastRoom> {
    if (!wire.broadcasts) wire.broadcasts = new Map<string, BroadcastRoom>();
    return wire.broadcasts;
}

export class WireBroadcast {
    public connections = 0;
    private channel = "global";
    private component?: Component;
    private kire: any;

    constructor(private options: BroadcastOptions = {}) {
        this.options.autodelete ??= true;
        if (this.options.name) this.channel = this.options.name;
    }

    public hydrate(component: Component, channel?: string, applySharedState = true) {
        this.component = component;
        this.kire = (component as any).kire;
        if (channel) this.channel = channel;

        const wire = this.kire?.$kire?.["~wire"];
        if (!wire) return;

        const rooms = ensureRooms(wire);
        let room = rooms.get(this.channel);
        if (!room) {
            room = {
                name: this.channel,
                state: new NullProtoObj(),
                components: new Set<string>(),
                listeners: new Set<ReadableStreamDefaultController<string>>()
            };
            rooms.set(this.channel, room);
        }

        if (this.options.maxconnections && room.components.size >= this.options.maxconnections) {
            throw new Error("Broadcast room is full");
        }

        room.components.add(component.__id);
        this.connections = room.components.size;

        // Shared room state is authoritative for included fields.
        // This keeps all clients/actions consistent even when a client has stale local state.
        if (applySharedState) {
            const shared = this.filterState(room.state);
            if (Object.keys(shared).length > 0) {
                component.fill(shared);
            }
        }

        component.onUpdateState((updates) => {
            this.propagate(updates);
        });
    }

    public close() {
        if (!this.component || !this.kire) return;
        const wire = this.kire.$kire?.["~wire"];
        const rooms = wire?.broadcasts as Map<string, BroadcastRoom> | undefined;
        const room = rooms?.get(this.channel);
        if (!room) return;
        room.components.delete(this.component.__id);
        this.connections = room.components.size;
        this.gcRoom(this.channel, room);
    }

    public emit(event: string, data: any) {
        if (!this.kire) return;
        const wire = this.kire.$kire?.["~wire"];
        const rooms = wire?.broadcasts as Map<string, BroadcastRoom> | undefined;
        const room = rooms?.get(this.channel);
        if (!room || room.listeners.size === 0) {
            this.gcRoom(this.channel, room);
            return;
        }

        const payload = { type: event, channel: this.channel, data };
        const stale: ReadableStreamDefaultController<string>[] = [];
        for (const controller of room.listeners) {
            try {
                this.pushEvent(controller, event, payload);
            } catch {
                stale.push(controller);
            }
        }
        if (stale.length > 0) {
            stale.forEach((c) => room.listeners.delete(c));
            this.gcRoom(this.channel, room);
        }
    }

    public update(component: Component) {
        if (!this.kire || this.component?.__id !== component.__id) {
            this.hydrate(component, undefined, false);
        }
        if (!this.kire) return;

        const wire = this.kire.$kire?.["~wire"];
        const rooms = ensureRooms(wire);
        let room = rooms.get(this.channel);
        if (!room) {
            room = {
                name: this.channel,
                state: new NullProtoObj(),
                components: new Set<string>(),
                listeners: new Set<ReadableStreamDefaultController<string>>()
            };
            rooms.set(this.channel, room);
        }

        const current = this.filterState(component.getPublicProperties());
        if (Object.keys(current).length === 0) return;

        const changed: Record<string, any> = new NullProtoObj();
        for (const [key, value] of Object.entries(current)) {
            if (JSON.stringify((room.state as any)[key]) !== JSON.stringify(value)) {
                changed[key] = value;
            }
        }

        if (Object.keys(changed).length === 0) return;
        Object.assign(room.state, changed);
        this.emit("wire:broadcast:update", changed);
    }

    public connectSSE(controller: ReadableStreamDefaultController<string>) {
        if (!this.kire) return;
        const wire = this.kire.$kire?.["~wire"];
        const rooms = ensureRooms(wire);
        let room = rooms.get(this.channel);
        if (!room) {
            room = {
                name: this.channel,
                state: new NullProtoObj(),
                components: new Set<string>(),
                listeners: new Set<ReadableStreamDefaultController<string>>()
            };
            rooms.set(this.channel, room);
        }
        room.listeners.add(controller);
        const snapshot = this.filterState(room.state);
        try {
            this.pushEvent(controller, "wire:broadcast:snapshot", { type: "wire:broadcast:snapshot", channel: this.channel, data: snapshot });
        } catch {
            room.listeners.delete(controller);
            this.gcRoom(this.channel, room);
        }
    }

    public disconnectSSE(controller: ReadableStreamDefaultController<string>) {
        if (!this.kire) return;
        const wire = this.kire.$kire?.["~wire"];
        const rooms = wire?.broadcasts as Map<string, BroadcastRoom> | undefined;
        const room = rooms?.get(this.channel);
        if (!room) return;
        room.listeners.delete(controller);
        this.gcRoom(this.channel, room);
    }

    private propagate(updates: Record<string, any>) {
        if (!this.kire) return;
        const wire = this.kire.$kire?.["~wire"];
        const rooms = ensureRooms(wire);
        let room = rooms.get(this.channel);
        if (!room) {
            room = {
                name: this.channel,
                state: new NullProtoObj(),
                components: new Set<string>(),
                listeners: new Set<ReadableStreamDefaultController<string>>()
            };
            rooms.set(this.channel, room);
        }

        const filtered = this.filterState(updates);
        if (Object.keys(filtered).length === 0) return;

        const changed: Record<string, any> = new NullProtoObj();
        for (const [key, value] of Object.entries(filtered)) {
            if (JSON.stringify((room.state as any)[key]) !== JSON.stringify(value)) {
                changed[key] = value;
            }
        }

        if (Object.keys(changed).length === 0) return;
        Object.assign(room.state, changed);
        this.emit("wire:broadcast:update", changed);
    }

    private filterState(state: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = new NullProtoObj();
        for (const [key, val] of Object.entries(state || {})) {
            if (this.options.excludes?.includes(key)) continue;
            if (this.options.includes && !this.options.includes.includes(key)) continue;
            result[key] = val;
        }
        return result;
    }

    private gcRoom(name: string, room?: BroadcastRoom) {
        if (!this.options.autodelete || !this.kire || !room) return;
        // "Connected" for broadcast means active stream listeners.
        if (room.listeners.size === 0) {
            const wire = this.kire.$kire?.["~wire"];
            const rooms = wire?.broadcasts as Map<string, BroadcastRoom> | undefined;
            rooms?.delete(name);
        }
    }

    private pushEvent(controller: ReadableStreamDefaultController<string>, event: string, payload: any) {
        controller.enqueue(`event: ${event}\n`);
        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
    }
}
