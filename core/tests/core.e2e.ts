import { test, expect } from "@playwright/test";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const coreDir = resolve(repoRoot, "core");
const bunBin = process.platform === "win32" ? "bun.exe" : "bun";
const port = 3210;
const baseUrl = `http://127.0.0.1:${port}`;
const isPlaywrightRuntime =
    process.env.PLAYWRIGHT_SUITE_DIR !== undefined ||
    process.argv.some((arg) => arg.toLowerCase().includes("playwright")) ||
    process.env.PLAYWRIGHT_JSON_OUTPUT_NAME !== undefined;

let serverProcess: ChildProcessWithoutNullStreams | null = null;

async function waitForServer(url: string, timeoutMs = 30_000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {}
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
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
test.describe("Core E2E (Playwright)", () => {
    test.beforeAll(async () => {
        serverProcess = spawn(bunBin, ["run", "tests/core-e2e-server.ts"], {
            cwd: coreDir,
            shell: false,
            stdio: "pipe",
            env: {
                ...process.env,
                CORE_E2E_PORT: String(port),
            },
        });

        await waitForServer(baseUrl);
    });

    test.afterAll(async () => {
        await stopServer();
    });

    test("renderiza condicional e loop", async ({ page }) => {
        await page.goto(baseUrl);

        await expect(page.locator("h1")).toHaveText("Hello Playwright");
        await expect(page.locator("li.item")).toHaveCount(3);
        await expect(page.locator("li.item").nth(0)).toHaveText("A");
        await expect(page.locator("li.item").nth(1)).toHaveText("B");
        await expect(page.locator("li.item").nth(2)).toHaveText("C");
    });

    test("permite alterar estado por querystring (show/items)", async ({ page }) => {
        await page.goto(`${baseUrl}/?show=0`);
        await expect(page.locator("h1")).toHaveText("Hidden");

        await page.goto(`${baseUrl}/?name=QueryTest&items=X,Y`);
        await expect(page.locator("h1")).toHaveText("Hello QueryTest");
        await expect(page.locator("li.item")).toHaveCount(2);
        await expect(page.locator("li.item").nth(0)).toHaveText("X");
        await expect(page.locator("li.item").nth(1)).toHaveText("Y");
    });

    test("escapa interpolacao de nome no HTML", async ({ page }) => {
        const unsafeName = "<script>pw</script>";
        await page.goto(`${baseUrl}/?name=${encodeURIComponent(unsafeName)}`);

        await expect(page.locator("h1")).toHaveText(`Hello ${unsafeName}`);
        await expect(page.locator("script")).toHaveCount(0);
    });

    test("renderiza template inline com expressao JS", async ({ page }) => {
        await page.goto(`${baseUrl}/inline`);
        await expect(page.locator(".msg")).toHaveText("CORE E2E");
    });

    test("renderiza template inline com mensagem customizada por query", async ({ page }) => {
        await page.goto(`${baseUrl}/inline?message=playwright ok`);
        await expect(page.locator(".msg")).toHaveText("PLAYWRIGHT OK");
    });
});
}
