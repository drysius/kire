import { expect, test, describe } from "bun:test";
import { Kirewire } from "../src/kirewire";
import { Component } from "../src/component";
import { FileStore } from "../src/features/file-store";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync, readFileSync } from "node:fs";

describe("Kirewire Kernel", () => {
    test("should generate consistent checksums", () => {
        const wire = new Kirewire({ secret: "test-secret" });
        const state = { count: 0 };
        const session = "session-123";
        
        const hash1 = wire.generateChecksum(state, session);
        const hash2 = wire.generateChecksum(state, session);
        const hash3 = wire.generateChecksum({ count: 1 }, session);

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
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
});

describe("FileStore", () => {
    const testDir = join(tmpdir(), "kire-wire-tests");
    
    test("should store and retrieve files", () => {
        const store = new FileStore(testDir);
        const content = Buffer.from("hello world");
        const id = store.store("test.txt", content);
        
        const path = store.get(id);
        expect(path).not.toBeNull();
        expect(existsSync(path!)).toBe(true);
        expect(readFileSync(path!).toString()).toBe("hello world");
        
        store.delete(id);
        expect(existsSync(path!)).toBe(false);
    });
});
