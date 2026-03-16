import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Kire } from "kire";
import { HttpAdapter } from "../src/adapters/http";
import { Kirewire } from "../src/kirewire";

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
		const tempDir = join(
			process.cwd(),
			"node_modules",
			`.kirewire_uploads_test_${Date.now()}`,
		);
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

	test("rejects files bigger than maxUploadBytes", async () => {
		const adapter = new HttpAdapter({ route: "/_wire", maxUploadBytes: 4 });
		const fakePart = {
			filename: "big.txt",
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

		expect(response.status).toBe(413);
		expect(String((response.result as any)?.error || "")).toContain(
			"maximum allowed size",
		);
	});

	test("returns 500 when file store persistence fails", async () => {
		const adapter = new HttpAdapter({
			route: "/_wire",
			fileStore: {
				store: () => {
					throw new Error("disk full");
				},
				get: () => null,
				delete: () => {},
				destroy: () => {},
			} as any,
		});
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

		expect(response.status).toBe(500);
		expect(String((response.result as any)?.error || "")).toContain(
			"Failed to store uploaded file",
		);
	});

	test("serves uploaded previews from the built-in preview endpoint", async () => {
		const tempDir = join(
			process.cwd(),
			"node_modules",
			`.kirewire_preview_test_${Date.now()}`,
		);
		tempDirs.push(tempDir);

		const adapter = new HttpAdapter({ route: "/_wire", tempDir });
		const fakePart = {
			filename: "hello.png",
			mimetype: "image/png",
			toBuffer: async () => Buffer.from("preview-bytes"),
		};

		const upload = await adapter.handleRequest(
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

		const fileId = String((upload.result as any)?.files?.[0]?.id || "");
		expect(fileId).not.toBe("");

		const preview = await adapter.handleRequest(
			{
				method: "GET",
				url: `/_wire/preview?id=${encodeURIComponent(fileId)}&mime=image/png`,
			},
			"user-1",
			"session-1",
		);

		expect(preview.status).toBe(200);
		expect(preview.headers?.["Content-Type"]).toBe("image/png");
		expect(preview.headers?.["Cache-Control"]).toBe("no-store");
	});

	test("returns explicit adapter install error for component calls when not installed", async () => {
		const adapter = new HttpAdapter({ route: "/_wire" });

		const response = await adapter.handleRequest(
			{
				method: "POST",
				url: "/_wire",
				body: {
					id: "missing",
					method: "increment",
					params: [],
				},
			},
			"user-1",
			"session-1",
		);

		expect(response.status).toBe(500);
		expect(String((response.result as any)?.error || "")).toContain(
			"HttpAdapter is not installed",
		);
	});

	test("supports normal component calls after install", async () => {
		const adapter = new HttpAdapter({ route: "/_wire" });
		adapter.install(new Kirewire({ secret: "upload-test" }), new Kire());

		const response = await adapter.handleRequest(
			{
				method: "POST",
				url: "/_wire",
				body: {
					id: "missing",
					method: "increment",
					params: [],
				},
			},
			"user-1",
			"session-1",
		);

		expect(response.status).toBe(200);
		expect(String((response.result as any)?.error || "")).toContain(
			"Component missing not found.",
		);
	});
});
