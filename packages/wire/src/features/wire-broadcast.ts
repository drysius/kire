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

export class WireBroadcast {
    private static readonly DEFAULT_TTL_MS = 5 * 60 * 1000;
    private static readonly CONNECTION_STALE_FACTOR = 2;
    private static readonly CLEANUP_INTERVAL_MS = 60 * 1000;
    private static rooms = new Map<string, WireBroadcastRoom>();
    private static cleanupTimer: ReturnType<typeof setInterval> | null = null;

    public connected = false;
    public connections = 0;
    public channel = "global";
    public chunks: string[] = [];

    constructor(private options: WireBroadcastOptions = {}) {
        this.options.autodelete ??= true;
        if (options.name) this.channel = options.name;
        WireBroadcast.ensureCleanupLoop();
    }

    public hydrate(component: Record<string, any>, channel?: string) {
        if (channel) this.channel = channel;
        const room = this.getRoom();

        this.touchConnection(room, component);
        this.connected = true;
        this.connections = room.connections.size;

        const snapshot = this.filterState(room.state);
        for (const [key, value] of Object.entries(snapshot)) {
            if (key in component && typeof component[key] !== "function") {
                component[key] = value;
            }
        }

        this.pushChunk(`Hydrated channel "${this.channel}"`);
    }

    public update(component: Record<string, any>) {
        const room = this.getRoom();
        this.touchConnection(room, component);
        this.connected = true;
        this.connections = room.connections.size;

        const current = this.filterState(component);
        const changedKeys: string[] = [];

        for (const [key, value] of Object.entries(current)) {
            if (JSON.stringify(room.state[key]) !== JSON.stringify(value)) {
                room.state[key] = value;
                changedKeys.push(key);
            }
        }

        if (changedKeys.length > 0) {
            this.pushChunk(`Updated: ${changedKeys.join(", ")}`);
        }
    }

    public verifyPassword(password?: string | null): boolean {
        const expected = this.options.password;
        if (!expected) return true;
        return String(password || "") === String(expected);
    }

    public getChannel(): string {
        return this.channel;
    }

    public getRoomId(): string {
        return this.makeRoomId(this.channel, this.options.password);
    }

    private getRoom(): WireBroadcastRoom {
        const roomId = this.getRoomId();
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
            if (!room.password && this.options.password) room.password = this.options.password;
            room.lastSeen = Date.now();
        }

        this.pruneRoomConnections(room);
        return room;
    }

    private filterState(state: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(state || {})) {
            if (key.startsWith("$") || key.startsWith("_")) continue;
            if (typeof value === "function") continue;
            if (this.options.excludes?.includes(key)) continue;
            if (this.options.includes && !this.options.includes.includes(key)) continue;
            result[key] = value;
        }
        return result;
    }

    private pushChunk(message: string) {
        const line = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.chunks.unshift(line);
        if (this.chunks.length > 50) this.chunks.length = 50;
    }

    private static ensureCleanupLoop() {
        if (WireBroadcast.cleanupTimer) return;

        WireBroadcast.cleanupTimer = setInterval(() => {
            WireBroadcast.cleanupRooms();
        }, WireBroadcast.CLEANUP_INTERVAL_MS);

        (WireBroadcast.cleanupTimer as any).unref?.();
    }

    private static cleanupRooms() {
        const now = Date.now();
        for (const [roomId, room] of WireBroadcast.rooms.entries()) {
            const staleLimit = room.ttlMs * WireBroadcast.CONNECTION_STALE_FACTOR;
            for (const [connectionId, seenAt] of room.connections.entries()) {
                if (now - seenAt > staleLimit) {
                    room.connections.delete(connectionId);
                }
            }

            if (!room.autodelete) continue;
            if (room.connections.size > 0) continue;
            if (now - room.lastSeen < room.ttlMs) continue;
            WireBroadcast.rooms.delete(roomId);
        }
    }

    private touchConnection(room: WireBroadcastRoom, component: Record<string, any>) {
        const now = Date.now();
        const connectionId = this.getConnectionId(component);
        if (connectionId) {
            room.connections.set(connectionId, now);
        }
        room.lastSeen = now;
        this.pruneRoomConnections(room);
    }

    private pruneRoomConnections(room: WireBroadcastRoom) {
        const now = Date.now();
        const staleLimit = room.ttlMs * WireBroadcast.CONNECTION_STALE_FACTOR;

        for (const [connectionId, seenAt] of room.connections.entries()) {
            if (now - seenAt > staleLimit) {
                room.connections.delete(connectionId);
            }
        }
    }

    private getConnectionId(component: Record<string, any>): string {
        const scope = String((component as any).$wire_scope_id || "");
        const id = String((component as any).$id || (component as any).__id || "");
        if (!scope && !id) return "";
        return `${scope}:${id}:${this.getRoomId()}`;
    }

    private getTtlMs(): number {
        const ttlMs = Number(this.options.ttlMs);
        if (!Number.isFinite(ttlMs) || ttlMs <= 0) return WireBroadcast.DEFAULT_TTL_MS;
        return ttlMs;
    }

    private makeRoomId(channel: string, password?: string): string {
        return JSON.stringify([channel, password || ""]);
    }
}
