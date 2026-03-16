import {
	type ChildProcessWithoutNullStreams,
	spawn,
	spawnSync,
} from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const wireDir = resolve(repoRoot, "packages/wire");
const exampleDir = resolve(repoRoot, "docs");
const baseUrl = "http://127.0.0.1:3000";
const bunBin = process.platform === "win32" ? "bun.exe" : "bun";
const isPlaywrightRuntime =
	process.env.PLAYWRIGHT_SUITE_DIR !== undefined ||
	process.argv.some((arg) => arg.toLowerCase().includes("playwright")) ||
	process.env.PLAYWRIGHT_JSON_OUTPUT_NAME !== undefined;

let serverProcess: ChildProcessWithoutNullStreams | null = null;

function runBunSync(args: string[], cwd: string) {
	const result = spawnSync(bunBin, args, {
		cwd,
		stdio: "inherit",
		shell: false,
	});

	if (result.status !== 0) {
		throw new Error(
			`Command failed: bun ${args.join(" ")} (exit ${result.status})`,
		);
	}
}

async function waitForServer(url: string, timeoutMs = 60_000) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < timeoutMs) {
		try {
			const response = await fetch(url);
			if (response.ok) return;
		} catch {}
		await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
	}
	throw new Error(`Timed out waiting for server at ${url}`);
}

async function stopServer() {
	if (!serverProcess) return;
	serverProcess.kill("SIGTERM");
	await new Promise<void>((resolvePromise) => {
		const proc = serverProcess!;
		const timeout = setTimeout(() => {
			if (!proc.killed) proc.kill("SIGKILL");
			resolvePromise();
		}, 3000);
		proc.once("exit", () => {
			clearTimeout(timeout);
			resolvePromise();
		});
	});
	serverProcess = null;
}

if (isPlaywrightRuntime) {
	test.describe("Wire Socket E2E (Playwright)", () => {
		test.beforeAll(async () => {
			runBunSync(["run", "prebuild"], wireDir);

			serverProcess = spawn(bunBin, ["run", "main.ts", "--socket"], {
				cwd: exampleDir,
				shell: false,
				stdio: "pipe",
			});

			await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
			if (!serverProcess || serverProcess.exitCode !== null) {
				throw new Error(
					"Failed to start docs server in socket mode. Port 3000 may already be in use.",
				);
			}

			await waitForServer(baseUrl);
		});

		test.afterAll(async () => {
			await stopServer();
		});

		test("uses websocket for wire calls (no POST /_wire and no EventSource)", async ({
			page,
		}) => {
			const wirePosts: string[] = [];
			const sseRequests: string[] = [];
			const socketUrls: string[] = [];
			const pageErrors: string[] = [];

			page.on("request", (request) => {
				const url = request.url();
				if (request.method() === "POST" && url.includes("/_wire")) {
					wirePosts.push(url);
				}
				if (url.includes("/_wire/sse")) {
					sseRequests.push(url);
				}
			});

			page.on("websocket", (ws) => {
				socketUrls.push(ws.url());
			});

			page.on("pageerror", (err) => {
				pageErrors.push(err.message);
			});

			await page.goto(`${baseUrl}/kirewire`);

			const runtimeInfo = await page.evaluate(() => {
				const wire = (window as any).Kirewire;
				const socketCtor = wire?.SocketClientAdapter;

				return {
					transportMeta:
						document
							.querySelector('meta[name="kirewire:transport"]')
							?.getAttribute("content") || null,
					hasSocketCtor: typeof socketCtor,
					usesSocketAdapter: Boolean(
						socketCtor && wire?.adapter instanceof socketCtor,
					),
				};
			});

			expect(runtimeInfo.transportMeta).toBe("socket");
			expect(runtimeInfo.hasSocketCtor).toBe("function");
			expect(runtimeInfo.usesSocketAdapter).toBe(true);

			await expect
				.poll(() => socketUrls.some((url) => url.includes("/_wire/socket")))
				.toBe(true);

			const senderCard = page.locator(".card", {
				has: page.getByRole("heading", { name: "Sender" }),
			});
			const senderInput = senderCard.getByPlaceholder("Type...");
			const sendButton = senderCard.getByRole("button", { name: "Send" });

			const text = "socket-no-http-check";
			await senderInput.fill(text);
			await sendButton.click();

			const receiverMessage = page
				.locator("h3.card-title")
				.filter({ hasText: "Receiver" })
				.locator("xpath=following-sibling::p[1]");
			await expect(receiverMessage).toContainText(`Received: ${text} at`);

			expect(wirePosts).toEqual([]);
			expect(sseRequests).toEqual([]);
			expect(pageErrors).toEqual([]);
		});
	});
}
