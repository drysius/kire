import { afterEach, describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
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
		expect(preview.headers?.["X-Content-Type-Options"]).toBe("nosniff");
	});

	test("ignores user-provided mime override on preview endpoint", async () => {
		const tempDir = join(
			process.cwd(),
			"node_modules",
			`.kirewire_preview_mime_test_${Date.now()}`,
		);
		tempDirs.push(tempDir);

		const adapter = new HttpAdapter({ route: "/_wire", tempDir });
		const fakePart = {
			filename: "safe.png",
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
				url: `/_wire/preview?id=${encodeURIComponent(fileId)}&mime=text/html`,
			},
			"user-1",
			"session-1",
		);

		expect(preview.status).toBe(200);
		expect(preview.headers?.["Content-Type"]).toBe("image/png");
		expect(preview.headers?.["X-Content-Type-Options"]).toBe("nosniff");
	});

	test("moves uploaded files using /upload/move endpoint", async () => {
		const tempDir = join(
			process.cwd(),
			"node_modules",
			`.kirewire_upload_move_test_${Date.now()}`,
		);
		tempDirs.push(tempDir);

		const moveDir = join(tempDir, "moved");
		const adapter = new HttpAdapter({ route: "/_wire", tempDir });
		const fakePart = {
			filename: "hello.txt",
			mimetype: "text/plain",
			toBuffer: async () => Buffer.from("hello upload"),
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

		const move = await adapter.handleRequest(
			{
				method: "POST",
				url: "/_wire/upload/move",
				body: {
					id: fileId,
					destination: `${moveDir}/`,
				},
			},
			"user-1",
			"session-1",
		);

		expect(move.status).toBe(200);
		const moved = (move.result as any)?.moved || [];
		expect(Array.isArray(moved)).toBe(true);
		expect(moved.length).toBe(1);
		expect(String(moved[0]?.path || "")).toContain("moved");
		expect(existsSync(String(moved[0]?.path || ""))).toBe(true);
		expect(readFileSync(String(moved[0]?.path || ""), "utf8")).toBe(
			"hello upload",
		);
	});

	test("autoclean removes stale upload files on adapter setup", async () => {
		const tempDir = join(
			process.cwd(),
			"node_modules",
			`.kirewire_autoclean_test_${Date.now()}`,
		);
		tempDirs.push(tempDir);

		const staleFile = join(tempDir, "stale.tmp");
		mkdirSync(tempDir, { recursive: true });
		writeFileSync(staleFile, "stale-data");
		expect(existsSync(staleFile)).toBe(true);

		const adapter = new HttpAdapter({
			route: "/_wire",
			tempDir,
			autoClean: true,
		});
		adapter.install(new Kirewire({ secret: "autoclean-test" }), new Kire());

		expect(existsSync(staleFile)).toBe(false);
		expect(readdirSync(tempDir).length).toBe(0);
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
		expect((response.result as any)?.reload).toBe(true);
		expect((response.result as any)?.reason).toBe("component-missing");
	});
});
