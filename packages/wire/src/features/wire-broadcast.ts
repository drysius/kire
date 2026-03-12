import { WireProperty } from "../wire-property";

export interface WireBroadcastOptions {
    name?: string;
    autodelete?: boolean;
    includes?: string[];
    excludes?: string[];
    password?: string;
    ttlMs?: number;
}

type WireBroadcastRoom = {
    state: Record<string, any>;
    connections: Map<string, number>;
    password?: string;
    lastSeen: number;
    ttlMs: number;
    autodelete: boolean;
};

export class WireBroadcast extends WireProperty {
    private static readonly DEFAULT_TTL_MS = 5 * 60 * 1000;
    private static readonly CONNECTION_STALE_FACTOR = 2;
    private static readonly CLEANUP_INTERVAL_MS = 60 * 1000;
    private static rooms = new Map<string, WireBroadcastRoom>();
    private static cleanupTimer: ReturnType<typeof setInterval> | null = null;

    public readonly __wire_type = 'broadcast';
    public connected = false;
    public connections = 0;
    public channel = "global";
    public chunks: string[] = [];
    public state: Record<string, any> = {};

    constructor(private options: WireBroadcastOptions = {}) {
        super();
        this.options.autodelete ??= true;
        if (options.name) this.channel = options.name;
        WireBroadcast.ensureCleanupLoop();
    }

    public hydrate(value: any): void {
        if (value && typeof value === 'object') {
            if (value.channel) this.channel = value.channel;
            if (value.state) this.state = value.state;
            this.connected = !!value.connected;
            this.connections = Number(value.connections || 0);
        }
    }

    public dehydrate(): any {
        return {
            channel: this.channel,
            state: this.state,
            connected: this.connected,
            connections: this.connections,
            __wire_type: this.__wire_type
        };
    }

    /**
     * Internal server-side hydration from the room state.
     */
    public serverHydrate(component: Record<string, any>) {
        const room = this.getRoom();
        this.touchConnection(room, component);
        this.connected = true;
        this.connections = room.connections.size;

        const snapshot = this.filterState(room.state);
        const keys = Object.keys(snapshot);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key in component && typeof component[key] !== "function") {
                component[key] = snapshot[key];
            }
        }
        this.state = snapshot;
    }

    public update(component: Record<string, any>, kirewire?: any) {
        const room = this.getRoom();
        this.touchConnection(room, component);
        this.connected = true;
        this.connections = room.connections.size;

        const current = this.filterState(component);
        const keys = Object.keys(current);
        let changed = false;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (JSON.stringify(room.state[key]) !== JSON.stringify(current[key])) {
                room.state[key] = current[key];
                changed = true;
            }
        }

        if (changed && kirewire) {
            this.state = { ...room.state };
            kirewire.emit(`broadcast:${this.channel}`, {
                channel: this.channel,
                state: this.state
            });
        }
    }

    public disconnect(component: Record<string, any>) {
        const room = this.findRoom();
        if (!room) {
            this.connected = false;
            this.connections = 0;
            return;
        }

        room.connections.delete(this.makeConnectionId(component));
        room.lastSeen = Date.now();
        this.connections = room.connections.size;
        this.connected = this.connections > 0;
    }

    public getRoomId(): string {
        return this.makeRoomId(this.channel, this.options.password);
    }

    public static cleanupNow(now: number = Date.now()) {
        for (const [roomId, room] of WireBroadcast.rooms.entries()) {
            WireBroadcast.pruneConnections(room, now);

            if (room.connections.size > 0) {
                room.lastSeen = now;
            }

            if (room.autodelete && now - room.lastSeen > room.ttlMs && room.connections.size === 0) {
                WireBroadcast.rooms.delete(roomId);
            }
        }
    }

    private getRoom(): WireBroadcastRoom {
        const roomId = this.makeRoomId(this.channel, this.options.password);
        let room = WireBroadcast.rooms.get(roomId);

        if (!room) {
            room = {
                state: {},
                connections: new Map<string, number>(),
                password: this.options.password,
                lastSeen: Date.now(),
                ttlMs: this.getTtlMs(),
                autodelete: this.options.autodelete !== false,
            };
            WireBroadcast.rooms.set(roomId, room);
        } else {
            WireBroadcast.pruneConnections(room);
            room.lastSeen = Date.now();
        }

        return room;
    }

    private findRoom(): WireBroadcastRoom | null {
        return WireBroadcast.rooms.get(this.getRoomId()) || null;
    }

    private filterState(state: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        const keys = Object.keys(state || {});
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.charCodeAt(0) === 36 || key.charCodeAt(0) === 95) continue;
            if (typeof state[key] === "function") continue;
            if (this.options.excludes?.includes(key)) continue;
            if (this.options.includes && !this.options.includes.includes(key)) continue;
            result[key] = state[key];
        }
        return result;
    }

    private static ensureCleanupLoop() {
        if (WireBroadcast.cleanupTimer) return;
        const timer = setInterval(() => {
            WireBroadcast.cleanupNow(Date.now());
        }, WireBroadcast.CLEANUP_INTERVAL_MS);
        if (typeof (timer as any)?.unref === "function") {
            (timer as any).unref();
        }
        WireBroadcast.cleanupTimer = timer;
    }

    private touchConnection(room: WireBroadcastRoom, component: Record<string, any>) {
        WireBroadcast.pruneConnections(room);
        const connectionId = this.makeConnectionId(component);
        room.connections.set(connectionId, Date.now());
        room.lastSeen = Date.now();
    }

    private getTtlMs(): number {
        return Number(this.options.ttlMs) || WireBroadcast.DEFAULT_TTL_MS;
    }

    private makeRoomId(channel: string, password?: string): string {
        return `${channel}:${password || ""}`;
    }

    private makeConnectionId(component: Record<string, any>): string {
        const id = String((component as any).$id || "anonymous");
        return `${id}:${this.channel}`;
    }

    private static pruneConnections(room: WireBroadcastRoom, now: number = Date.now()) {
        const staleAfter = Math.max(
            WireBroadcast.CLEANUP_INTERVAL_MS,
            room.ttlMs * WireBroadcast.CONNECTION_STALE_FACTOR,
        );

        for (const [connectionId, lastSeen] of room.connections.entries()) {
            if (now - lastSeen > staleAfter) {
                room.connections.delete(connectionId);
            }
        }
    }
}
