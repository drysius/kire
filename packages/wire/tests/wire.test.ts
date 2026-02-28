import { expect, test, describe } from "bun:test";
import { Kirewire } from "../src/kirewire";
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
