import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { HttpAdapter } from "../src/adapters/http";

const tempDirs: string[] = [];

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (!dir) continue;
        rmSync(dir, { recursive: true, force: true });
    }
});

describe("HttpAdapter upload parsing", () => {
    test("stores files from Fastify multipart body (attachFieldsToBody)", async () => {
        const tempDir = join(process.cwd(), "node_modules", `.kirewire_uploads_test_${Date.now()}`);
        tempDirs.push(tempDir);

        const adapter = new HttpAdapter({ route: "/_wire", tempDir });
        const fakePart = {
            filename: "hello.txt",
            mimetype: "text/plain",
            toBuffer: async () => Buffer.from("hello upload"),
        };

        const response = await adapter.handleRequest(
            {
                method: "POST",
                url: "/_wire/upload",
                body: {
                    files: { value: fakePart },
                },
            },
            "user-1",
            "session-1",
        );

        expect(response.status).toBe(200);
        const payload = response.result as any;
        expect(Array.isArray(payload.files)).toBe(true);
        expect(payload.files.length).toBe(1);
        expect(payload.files[0].name).toBe("hello.txt");
        expect(payload.files[0].mime).toBe("text/plain");
        expect(payload.files[0].size).toBe(12);

        const filePath = (adapter as any).fileStore.get(payload.files[0].id);
        expect(typeof filePath).toBe("string");
        expect(existsSync(filePath)).toBe(true);
        expect(readFileSync(filePath, "utf8")).toBe("hello upload");
    });
});
