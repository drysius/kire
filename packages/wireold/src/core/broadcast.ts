import { type Kire, NullProtoObj } from "kire";
import type { WireComponent } from "../component";

export interface BroadcastOptions {
    name?: string;
    maxconnections?: number;
    password?: string;
    excludes?: string[];
    includes?: string[];
}

/**
 * Manages real-time communication between components via SSE or Sockets.
 */
export class WireBroadcast {
    public connections = 0;
    private channel: string = "global";
    private kire: Kire | undefined;
    private component: WireComponent | undefined;

    constructor(private options: BroadcastOptions = {}) {}

    /**
     * Joins a specific channel.
     */
    public async join(channel: string, password?: string) {
        if (this.options.password && this.options.password !== password) {
            throw new Error("Invalid broadcast password");
        }
        this.channel = channel;
        // In SSE mode, this will be handled by the session manager
    }

    /**
     * Loads the broadcast for a component and channel.
     */
    public load(channel: string) {
        this.channel = channel;
    }

    /**
     * Synchronizes the component state with the broadcast room.
     */
    public sync(component: WireComponent) {
        this.component = component;
        this.kire = component.kire;
        
        // Register this instance in the Kire wire state
        const wire = this.kire["~wire"];
        if (!wire) return;

        let room = wire.rooms.get(this.channel);
        if (!room) {
            room = {
                name: this.channel,
                state: new NullProtoObj(),
                components: new Set()
            };
            wire.rooms.set(this.channel, room);
        }

        if (this.options.maxconnections && room.components.size >= this.options.maxconnections) {
            throw new Error("Broadcast room is full");
        }

        room.components.add(component.__id);
        this.connections = room.components.size;

        // Apply shared state to component (Initial Sync)
        this.applySharedState(room.state);

        // Hook into component updates to propagate changes
        component.onUpdateState((updates) => {
            this.propagate(updates);
        });
    }

    /**
     * Propagates local updates to the broadcast room.
     */
    private propagate(updates: Record<string, any>) {
        if (!this.kire || !this.component) return;
        const wire = this.kire["~wire"];
        const room = wire?.rooms.get(this.channel);
        if (!room) return;

        const filtered = this.filterState(updates);
        if (Object.keys(filtered).length === 0) return;

        // Update shared state
        Object.assign(room.state, filtered);

        // Emit to all components in the room except sender (if SSE/Socket active)
        this.emit("wire:component-update", {
            sender: this.component.__id,
            updates: filtered
        });
    }

    /**
     * Emits an event to all components in the current channel.
     */
    public emit(event: string, data: any) {
        if (!this.kire) return;
        const wire = this.kire["~wire"];
        const room = wire?.rooms.get(this.channel);
        if (!room) return;

        // Implementation will iterate through room components and push SSE events
        for (const compId of room.components) {
            const session = wire.sessions.get(compId);
            if (session) {
                session.emit(event, data);
            }
        }
    }

    /**
     * Disconnects a specific component ID from the broadcast.
     */
    public disconnect(connid: string) {
        if (!this.kire) return;
        const room = this.kire["~wire"]?.rooms.get(this.channel);
        if (room) {
            room.components.delete(connid);
            this.connections = room.components.size;
        }
    }

    /**
     * Closes the broadcast for this component.
     */
    public close() {
        if (this.component) {
            this.disconnect(this.component.__id);
        }
    }

    private applySharedState(state: Record<string, any>) {
        if (!this.component) return;
        const filtered = this.filterState(state);
        this.component.fill(filtered);
    }

    private filterState(state: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = new NullProtoObj();
        for (const [key, val] of Object.entries(state)) {
            if (this.options.excludes?.includes(key)) continue;
            if (this.options.includes && !this.options.includes.includes(key)) continue;
            result[key] = val;
        }
        return result;
    }
}
