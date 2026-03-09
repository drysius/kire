import { expect, test, describe } from "bun:test";
import { Kirewire } from "../src/kirewire";
import { Component } from "../src/component";
import { FileStore } from "../src/features/file-store";
import { WireProperty } from "../src/wire-property";
import { WireBroadcast } from "../src/features/wire-broadcast";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync, readFileSync } from "node:fs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("Kirewire Kernel", () => {
    test("should register custom wire property classes", () => {
        class DummyProperty extends WireProperty {
            public readonly __wire_type = "dummy";
            public hydrate(_value: any): void {}
            public dehydrate(): any { return null; }
        }

        const wire = new Kirewire({ secret: "test-secret" });
        wire.class("dummy", DummyProperty as any);

        expect(wire.propertyClasses.get("dummy")).toBe(DummyProperty as any);
    });

    test("should parse durations correctly", () => {
        const wire = new Kirewire({ secret: "s", expire_session: "2m" });
        // @ts-ignore - access private for test
        expect(wire.sessions.expireMs).toBe(120000);
    });

    test("component view should expose computed getters in template locals", () => {
        class ViewComponent extends Component {
            numbers = [1, 2];

            get doubled() {
                return this.numbers.map((n) => n * 2);
            }

            render() {
                return "";
            }
        }

        const component = new ViewComponent() as any;
        let capturedLocals: Record<string, any> | null = null;
        component.$kire = {
            view: (_view: string, locals: Record<string, any>) => {
                capturedLocals = locals;
                return "ok";
            },
        };

        component.view("components.fake", { extra: true });

        expect(capturedLocals).not.toBeNull();
        expect(capturedLocals!.$wire).toBe(component);
        expect(capturedLocals!.extra).toBe(true);
        expect(capturedLocals!.numbers).toEqual([1, 2]);
        expect(capturedLocals!.doubled).toEqual([2, 4]);
    });

    test("should apply locals safely and cleanup listener bindings on unmount", async () => {
        class ListenerComponent extends Component {
            public total = 0;
            public listeners = { ping: "onPing" };

            public async onPing(amount = 1) {
                this.total += Number(amount);
            }

            render() {
                return `total=${this.total}` as any;
            }
        }

        const wire = new Kirewire({ secret: "safe-locals-secret" });
        const component = new ListenerComponent() as any;
        component.$id = "cmp-1";

        const updates: any[] = [];
        const offUpdate = wire.on("component:update", (payload) => updates.push(payload));

        const listenerCleanup = wire.bindComponentListeners(component, {
            userId: "user-1",
            pageId: "page-1",
            id: component.$id,
        });
        wire.attachLifecycleGuards(component, listenerCleanup);

        wire.applySafeLocals(component, {
            total: 10,
            extra: "allowed",
            $id: "hacked",
            _private: "blocked",
            constructor: "blocked",
            onPing: "blocked",
        } as any);

        expect(component.total).toBe(10);
        expect(component.extra).toBe("allowed");
        expect(component.$id).toBe("cmp-1");
        expect(typeof component.onPing).toBe("function");

        await wire.emit("event:ping", { sourceId: "cmp-2", params: [2] });
        expect(component.total).toBe(12);
        expect(updates).toHaveLength(1);

        await component.unmount();
        await wire.emit("event:ping", { sourceId: "cmp-2", params: [3] });
        expect(component.total).toBe(12);

        offUpdate();
    });

    test("should use UUID ids for component/session/file resources", () => {
        const wire = new Kirewire({ secret: "id-secret" });

        const componentId = wire.createComponentId();
        expect(componentId).toMatch(UUID_RE);

        const session = wire.sessions.getSession("user-uuid");
        expect(session.publicId).toMatch(UUID_RE);
    });

    test("wire broadcast should disconnect and prune stale connections", () => {
        const channel = `room-${Date.now()}`;
        const broadcast = new WireBroadcast({ name: channel, ttlMs: 10, autodelete: false });
        const component = { $id: "component-1", count: 1 } as any;

        broadcast.update(component);
        const roomId = broadcast.getRoomId();
        const rooms = (WireBroadcast as any).rooms as Map<string, any>;
        const room = rooms.get(roomId);

        expect(room).toBeDefined();
        expect(room.connections.size).toBe(1);

        broadcast.disconnect(component);
        expect(room.connections.size).toBe(0);

        broadcast.update(component);
        const connectionId = `${component.$id}:${channel}`;
        room.connections.set(connectionId, Date.now() - 120_000);

        (WireBroadcast as any).cleanupNow(Date.now());
        expect(room.connections.size).toBe(0);
    });
});

describe("FileStore", () => {
    const testDir = join(tmpdir(), "kire-wire-tests");
    
    test("should store and retrieve files", () => {
        const store = new FileStore(testDir);
        const content = Buffer.from("hello world");
        const id = store.store("test.txt", content);
        expect(id).toMatch(UUID_RE);
        
        const path = store.get(id);
        expect(path).not.toBeNull();
        expect(existsSync(path!)).toBe(true);
        expect(readFileSync(path!).toString()).toBe("hello world");
        
        store.delete(id);
        expect(existsSync(path!)).toBe(false);
    });
});
