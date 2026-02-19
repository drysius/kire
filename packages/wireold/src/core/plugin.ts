import { kirePlugin, type Kire, NullProtoObj } from "kire";
import { randomUUID, createHmac } from "node:crypto";
import type { WireOptions, WireRequestOptions, WireRequestResponse } from "../types";
import { registerDirectives } from "./directives";
import { handleWireRequest } from "./handler";
import { discoverComponents } from "./discovery";
import { WireAttributes } from "./attrs-declarations";
import { ChecksumManager } from "./checksum";

/**
 * The unified Wire Plugin for Kire.
 * Centralizes registry, checksums, events and file uploads within the Kire instance.
 */
export const wirePlugin = kirePlugin<WireOptions>({
    route: "/_wire",
    adapter: "http",
    expire: "10m",
}, (kire, options) => {
    const secret = options.secret || randomUUID();
    
    // 1. Initialize internal state in the root Kire instance
    // This allows all forks to share the same registry and event bus
    kire.$kire["~wire"] = {
        components: new Map(), // Active instances for SSE/Real-time
        registry: new Map(),   // Component definitions (Class constructors)
        rooms: new Map(),      // Broadcast rooms for state sync
        sessions: new Map(),   // Component ID -> SSE/Socket Session
        events: new Map(),     // Component ID -> Pending Emits (consumed via 5s polling)
        tempFiles: new Map(),  // UUID -> { buffer, mime, name }
        checksum: new ChecksumManager(() => secret),
        options: { ...options, secret }
    };

    // 2. Inject Ergonomic APIs directly into Kire and its forks
    const setup = (instance: any) => {
        // Core request handler
        instance.wireRequest = (opts: WireRequestOptions) => handleWireRequest(instance, opts);
        
        // Component discovery (Auto-register from directory)
        instance.wired = (path: string) => discoverComponents(instance, path);
        
        // Manual component registration
        instance.wireRegister = (name: string, component: any) => {
            instance.$kire["~wire"].registry.set(name, component);
        };

        // Internal: Store a file in the shared temporary storage
        instance.wireStoreTempFile = async (buffer: Buffer, mime: string, name: string) => {
            const id = randomUUID();
            instance.$kire["~wire"].tempFiles.set(id, { buffer, mime, name });
            // Auto-cleanup after 1 hour to prevent memory leaks
            setTimeout(() => instance.$kire["~wire"].tempFiles.delete(id), 3600000);
            return id;
        };

        // Utility: Generate a secure keystore token
        instance.wireKeystore = (...keys: string[]) => {
            const content = keys.join("|");
            return createHmac("sha256", secret).update(content).digest("hex");
        };
    };

    setup(kire);
    kire.onFork(setup);
    
    // 3. Register global aliases for templates
    kire.$global("$wire", kire.$kire["~wire"]);

    // 4. Register attributes for IDE/Schema support
    for (const [key, value] of Object.entries(WireAttributes)) {
        kire.attribute({
            name: key,
            type: "string",
            description: value.comment,
            example: value.example,
        });
    }

    // 5. Register directives and elements (<wire:name>, @live)
    registerDirectives(kire);
});

// TypeScript Extensions for Kire
declare module 'kire' {
    interface Kire {
        wireRequest(options: WireRequestOptions): Promise<WireRequestResponse>;
        wired(path: string): Promise<void>;
        wireRegister(name: string, component: any): void;
        wireStoreTempFile(buffer: Buffer, mime: string, name: string): Promise<string>;
        wireKeystore(...keys: string[]): string;
        $wire: any; // Getter points to ~wire
        "~wire": {
            components: Map<string, any>;
            registry: Map<string, any>;
            checksum: ChecksumManager;
            rooms: Map<string, {
                name: string;
                state: Record<string, any>;
                components: Set<string>;
            }>;
            sessions: Map<string, {
                emit(event: string, data: any): void;
                close(): void;
            }>;
            events: Map<string, any[]>;
            tempFiles: Map<string, { buffer: Buffer, mime: string, name: string }>;
            options: WireOptions;
        };
    }
}
