import { NullProtoObj } from "kire";
import type { Component } from "./component";

export interface BroadcastOptions {
    name?: string;
    autodelete?: boolean;
    maxconnections?: number;
    excludes?: string[];
    includes?: string[];
    password?: string;
}

type BroadcastRoom = {
    name: string;
    state: Record<string, any>;
    components: Set<string>;
    listeners: Set<ReadableStreamDefaultController<string>>;
    password?: string;
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
    private boundUpdateHook = false;
    private dirtyKeys = new Set<string>();

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
                listeners: new Set<ReadableStreamDefaultController<string>>(),
                password: this.options.password
            };
            rooms.set(this.channel, room);
        }
        if (!room.password && this.options.password) room.password = this.options.password;

        if (this.options.maxconnections && room.listeners.size >= this.options.maxconnections) {
            throw new Error("Broadcast room is full");
        }

        room.components.add(component.__id);
        this.connections = room.listeners.size;

        // Shared room state is authoritative for included fields.
        // This keeps all clients/actions consistent even when a client has stale local state.
        if (applySharedState) {
            const shared = this.filterState(room.state);
            if (Object.keys(shared).length > 0) {
                component.fill(shared);
            }
        }

        if (!this.boundUpdateHook) {
            component.onUpdateState((updates) => {
                for (const key of Object.keys(updates || {})) {
                    this.dirtyKeys.add(key);
                }
                this.propagate(updates);
            });
            this.boundUpdateHook = true;
        }
    }

    public close() {
        if (!this.component || !this.kire) return;
        const wire = this.kire.$kire?.["~wire"];
        const rooms = wire?.broadcasts as Map<string, BroadcastRoom> | undefined;
        const room = rooms?.get(this.channel);
        if (!room) return;
        room.components.delete(this.component.__id);
        this.connections = room.listeners.size;
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

        const payload = { type: event, channel: this.channel, data, connections: room.listeners.size };
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
            // On first bind (e.g. SSR render for a fresh client), apply shared room state
            // so we don't overwrite existing room values with component defaults.
            this.hydrate(component, undefined, true);
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
                listeners: new Set<ReadableStreamDefaultController<string>>(),
                password: this.options.password
            };
            rooms.set(this.channel, room);
        }
        if (!room.password && this.options.password) room.password = this.options.password;

        const current = this.filterState(component.getPublicProperties());
        if (Object.keys(current).length === 0) return;
        const roomCurrent = this.filterState(room.state);
        const roomHasState = Object.keys(roomCurrent).length > 0;
        const dirtyCurrent = this.filterState(this.pickKeys(current, this.dirtyKeys));

        // Prevent fresh joins/initial renders from overriding an existing room state.
        // Only keys touched in this instance should be persisted when room already has data.
        if (roomHasState && Object.keys(dirtyCurrent).length === 0) {
            component.fill(roomCurrent);
            return;
        }

        const source = roomHasState ? dirtyCurrent : current;
        if (Object.keys(source).length === 0) return;

        const changed: Record<string, any> = new NullProtoObj();
        for (const [key, value] of Object.entries(source)) {
            if (JSON.stringify((room.state as any)[key]) !== JSON.stringify(value)) {
                changed[key] = value;
            }
        }

        if (Object.keys(changed).length === 0) return;
        Object.assign(room.state, changed);
        this.emit("wire:broadcast:update", changed);
        for (const key of Object.keys(changed)) {
            this.dirtyKeys.delete(key);
        }
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
                listeners: new Set<ReadableStreamDefaultController<string>>(),
                password: this.options.password
            };
            rooms.set(this.channel, room);
        }
        room.listeners.add(controller);
        this.connections = room.listeners.size;
        const snapshot = this.filterState(room.state);
        try {
            this.pushEvent(controller, "wire:broadcast:snapshot", {
                type: "wire:broadcast:snapshot",
                channel: this.channel,
                data: snapshot,
                connections: room.listeners.size
            });
        } catch {
            room.listeners.delete(controller);
            this.connections = room.listeners.size;
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
        this.connections = room.listeners.size;
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
                listeners: new Set<ReadableStreamDefaultController<string>>(),
                password: this.options.password
            };
            rooms.set(this.channel, room);
        }
        if (!room.password && this.options.password) room.password = this.options.password;

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
        // Keep room state across reconnects. Remove only empty inactive rooms.
        if (room.listeners.size > 0) return;
        if (Object.keys(room.state || {}).length > 0) return;
        const wire = this.kire.$kire?.["~wire"];
        const rooms = wire?.broadcasts as Map<string, BroadcastRoom> | undefined;
        rooms?.delete(name);
    }

    private pushEvent(controller: ReadableStreamDefaultController<string>, event: string, payload: any) {
        controller.enqueue(`event: ${event}\n`);
        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
    }

    private pickKeys(source: Record<string, any>, keys: Set<string>) {
        const out: Record<string, any> = new NullProtoObj();
        for (const key of keys) {
            if (key in source) out[key] = source[key];
        }
        return out;
    }

    public verifyPassword(password?: string | null): boolean {
        if (!this.options.password) return true;
        return String(password || "") === String(this.options.password);
    }

    public getChannel(): string {
        return this.channel;
    }
}
