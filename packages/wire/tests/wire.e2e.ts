import { test, expect } from "@playwright/test";
import { spawnSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../..");
const wireDir = resolve(repoRoot, "packages/wire");
const exampleDir = resolve(repoRoot, "docs/wire");
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
            shell: false,
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
        expect(batch[sendIndex - 1].state).toBeUndefined();
        expect(batch[sendIndex - 1].checksum).toBeUndefined();
        expect(batch[sendIndex].method).toBe("send");
        expect(batch[sendIndex].state).toBeUndefined();
        expect(batch[sendIndex].checksum).toBeUndefined();

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

    test("todo adiciona e remove tarefa", async ({ page }) => {
        await page.goto(`${baseUrl}/todo`);

        const taskInput = page.getByPlaceholder("New Task...");
        const addButton = page.getByRole("button", { name: "Add" });
        const taskText = "task-e2e-wire";

        await taskInput.fill(taskText);
        await addButton.click();

        const taskRow = page.locator("li", { hasText: taskText });
        await expect(taskRow).toBeVisible();

        await taskRow.locator("button").click({ force: true });
        await expect(taskRow).toHaveCount(0);
    });

    test("searchable filtra por busca e role", async ({ page }) => {
        await page.goto(`${baseUrl}/search`);

        const searchInput = page.getByPlaceholder("Search users...");
        const roleSelect = page.locator("select");

        await searchInput.fill("user37@example.com");
        await expect(page.getByRole("cell", { name: "User 37" })).toBeVisible();

        await roleSelect.selectOption("User");
        await expect(page.getByText('No users found matching "user37@example.com"')).toBeVisible();

        await roleSelect.selectOption("Admin");
        await expect(page.getByRole("cell", { name: "User 37" })).toBeVisible();
    });

    test("chat envia mensagem com username defer e limpa input", async ({ page }) => {
        await page.goto(`${baseUrl}/chat`);

        const chatCard = page.locator(".card", {
            has: page.getByRole("heading", { name: "Chat Room" }),
        });
        const usernameInput = chatCard.locator("input").first();
        const messageInput = chatCard.getByPlaceholder("Type a message...");
        const sendButton = chatCard.getByRole("button", { name: "Send" });

        const username = "E2EUser";
        const message = "chat-message-e2e";

        await usernameInput.fill(username);
        await messageInput.fill(message);
        await sendButton.click();

        const lastMessage = chatCard.locator(".chat").last();
        await expect(lastMessage.locator(".chat-header")).toContainText(username);
        await expect(lastMessage.locator(".chat-bubble")).toContainText(message);
        await expect(messageInput).toHaveValue("");
    });

    test("users e upload carregam sem erros de undefined", async ({ page }) => {
        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        await page.goto(`${baseUrl}/users`);
        await expect(page.getByRole("heading", { name: /Usuarios \(\d+\)/ })).toBeVisible();
        await expect(page.getByText("Page 1 of 5")).toBeVisible();

        await page.goto(`${baseUrl}/upload`);
        await expect(page.getByRole("heading", { name: "File Upload with Validation" })).toBeVisible();

        expect(pageErrors).toEqual([]);
    });

    test("stream, shared e toast funcionam", async ({ page }) => {
        const pageErrors: string[] = [];
        page.on("pageerror", (err) => pageErrors.push(err.message));

        await page.goto(`${baseUrl}/stream`);
        await page.getByRole("button", { name: "Add Log Stream" }).click();
        await expect(page.getByText("Log at", { exact: false }).first()).toBeVisible();

        await page.goto(`${baseUrl}/shared-components`);
        const counter = page.locator(".stat-value").first();
        const initialCounter = Number.parseInt((await counter.textContent()) || "0", 10);
        await page.getByRole("button", { name: "Increment Shared Counter" }).click();
        await expect(counter).toHaveText(String(initialCounter + 1));

        await page.goto(`${baseUrl}/toast`);
        await page.getByRole("button", { name: "Show Success" }).click();
        await expect(page.getByText("Operation successful!").first()).toBeVisible();

        expect(pageErrors).toEqual([]);
    });
});
}
