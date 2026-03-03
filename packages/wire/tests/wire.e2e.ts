import playwrightTest from "../../../examples/wire-example/node_modules/@playwright/test/index.js";
import { spawnSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const wireDir = resolve(repoRoot, "packages/wire");
const exampleDir = resolve(repoRoot, "examples/wire-example");
const baseUrl = "http://127.0.0.1:3000";
const bunBin = process.platform === "win32" ? "bun.exe" : "bun";
const { test, expect } = playwrightTest as any;
const isPlaywrightRuntime =
    process.env.PLAYWRIGHT_SUITE_DIR !== undefined ||
    process.argv.some((arg) => arg.toLowerCase().includes("playwright")) ||
    process.env.PLAYWRIGHT_JSON_OUTPUT_NAME !== undefined;

let serverProcess: ChildProcessWithoutNullStreams | null = null;

function runBunSync(args: string[], cwd: string) {
    const result = spawnSync(bunBin, args, {
        cwd,
        stdio: "inherit",
        shell: process.platform === "win32",
    });

    if (result.status !== 0) {
        throw new Error(`Command failed: bun ${args.join(" ")} (exit ${result.status})`);
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
test.describe("Wire E2E (Playwright)", () => {
    test.beforeAll(async () => {
        runBunSync(["run", "prebuild"], wireDir);

        serverProcess = spawn(bunBin, ["run", "main.ts"], {
            cwd: exampleDir,
            shell: process.platform === "win32",
            stdio: "pipe",
        });

        await waitForServer(baseUrl);
    });

    test.afterAll(async () => {
        await stopServer();
    });

    test("wire:model.defer envia $set antes de send e limpa input visual", async ({ page }) => {
        const observedBatches: any[][] = [];

        await page.route("**/_wire", async (route) => {
            try {
                const request = route.request();
                if (request.method() === "POST") {
                    const payload = request.postData();
                    if (payload) {
                        const parsed = JSON.parse(payload);
                        if (Array.isArray(parsed.batch)) observedBatches.push(parsed.batch);
                    }
                }
            } finally {
                await route.continue();
            }
        });

        await page.goto(`${baseUrl}/`);

        const senderCard = page.locator(".card", {
            has: page.getByRole("heading", { name: "Sender" }),
        });
        const senderInput = senderCard.getByPlaceholder("Type...");
        const sendButton = senderCard.getByRole("button", { name: "Send" });

        const text = "wire-batch-check";
        await senderInput.fill(text);
        await sendButton.click();

        await expect
            .poll(() => observedBatches.find((actions) => actions.some((action) => action.method === "send")))
            .not.toBeUndefined();

        const batch = observedBatches.find((actions) => actions.some((action) => action.method === "send"))!;
        const sendIndex = batch.findIndex((action) => action.method === "send");

        expect(sendIndex).toBeGreaterThan(0);
        expect(batch[sendIndex - 1].method).toBe("$set");
        expect(batch[sendIndex - 1].params).toEqual(["text", text]);
        expect(batch[sendIndex].method).toBe("send");

        await expect(senderInput).toHaveValue("");

        const receiverMessage = page
            .locator("h3.card-title")
            .filter({ hasText: "Receiver" })
            .locator("xpath=following-sibling::p[1]");
        await expect(receiverMessage).toContainText(`Received: ${text} at`);
    });

    test("textarea defer limpa visualmente apos submit", async ({ page }) => {
        await page.goto(`${baseUrl}/textarea`);

        const textarea = page.getByPlaceholder("Type a message...");
        const submitButton = page.getByRole("button", { name: "Submit" });
        const message = "mensagem visual";

        await textarea.fill(message);
        await submitButton.click();

        await expect(page.getByText(`Last Sent: ${message}`)).toBeVisible();
        await expect(textarea).toHaveValue("");
    });
});
}
