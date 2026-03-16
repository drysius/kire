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

function sleep(ms: number) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
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

			await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
			if (!serverProcess || serverProcess.exitCode !== null) {
				throw new Error(
					"Failed to start docs server. Port 3000 may already be in use.",
				);
			}

			await waitForServer(baseUrl);
		});

		test.afterAll(async () => {
			await stopServer();
		});

		test("wire:model.defer envia $set antes de send e limpa input visual", async ({
			page,
		}) => {
			const observedBatches: any[][] = [];

			await page.route("**/_wire", async (route) => {
				try {
					const request = route.request();
					if (request.method() === "POST") {
						const payload = request.postData();
						if (payload) {
							const parsed = JSON.parse(payload);
							if (Array.isArray(parsed.batch))
								observedBatches.push(parsed.batch);
						}
					}
				} finally {
					await route.continue();
				}
			});

			await page.goto(`${baseUrl}/kirewire`);

			const senderCard = page.locator(".card", {
				has: page.getByRole("heading", { name: "Sender" }),
			});
			const senderInput = senderCard.getByPlaceholder("Type...");
			const sendButton = senderCard.getByRole("button", { name: "Send" });

			const text = "wire-batch-check";
			await senderInput.fill(text);
			await sendButton.click();

			await expect
				.poll(() =>
					observedBatches.find((actions) =>
						actions.some((action) => action.method === "send"),
					),
				)
				.not.toBeUndefined();

			const batch = observedBatches.find((actions) =>
				actions.some((action) => action.method === "send"),
			)!;
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
			await page.goto(`${baseUrl}/kirewire/textarea`);

			const textarea = page.getByPlaceholder("Type a message...");
			const submitButton = page.getByRole("button", { name: "Submit" });
			const message = "mensagem visual";

			await textarea.fill(message);
			await submitButton.click();

			await expect(page.getByText(`Last Sent: ${message}`)).toBeVisible();
			await expect(textarea).toHaveValue("");
		});

		test("todo adiciona e remove tarefa", async ({ page }) => {
			await page.goto(`${baseUrl}/kirewire/todo`);

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
			await page.goto(`${baseUrl}/kirewire/search`);

			const searchInput = page.getByPlaceholder("Search users...");
			const roleSelect = page.locator("select");

			await searchInput.fill("user37@example.com");
			await expect(page.getByRole("cell", { name: "User 37" })).toBeVisible();
			await expect(page.getByRole("cell", { name: "User 38" })).toHaveCount(0);

			await roleSelect.selectOption("User");
			await expect(
				page.getByText('No users found matching "user37@example.com"'),
			).toBeVisible();

			await roleSelect.selectOption("Admin");
			await expect(page.getByRole("cell", { name: "User 37" })).toBeVisible();
		});

		test("wire:model.live preserva input focado durante respostas atrasadas", async ({
			page,
		}) => {
			let delayedSearchRequests = 0;

			await page.route("**/_wire", async (route) => {
				const request = route.request();
				if (request.method() !== "POST") {
					await route.continue();
					return;
				}

				const rawPayload = request.postData();
				if (!rawPayload) {
					await route.continue();
					return;
				}

				let parsedPayload: any;
				try {
					parsedPayload = JSON.parse(rawPayload);
				} catch {
					await route.continue();
					return;
				}

				const batch = Array.isArray(parsedPayload?.batch)
					? parsedPayload.batch
					: [];
				const updatesSearch = batch.some(
					(action: any) =>
						action?.method === "$set" && action?.params?.[0] === "search",
				);

				if (!updatesSearch) {
					await route.continue();
					return;
				}

				delayedSearchRequests += 1;
				if (delayedSearchRequests === 1) await sleep(300);
				if (delayedSearchRequests === 2) await sleep(1200);
				await route.continue();
			});

			await page.goto(`${baseUrl}/kirewire/users`);

			const searchInput = page.getByPlaceholder("Search users...");

			await searchInput.click();
			await searchInput.type("3");
			await page.waitForTimeout(80);
			await searchInput.type("7");

			await expect.poll(() => delayedSearchRequests >= 2).toBe(true);
			await page.waitForTimeout(500);

			await expect(searchInput).toBeFocused();
			await expect(searchInput).toHaveValue("37");

			await expect(page.getByText("user37@example.com")).toBeVisible();
			await expect(searchInput).toHaveValue("37");
		});

		test("wire:loading exibe feedback durante busca com latencia", async ({
			page,
		}) => {
			await page.route("**/_wire", async (route) => {
				const request = route.request();
				if (request.method() !== "POST") {
					await route.continue();
					return;
				}

				const rawPayload = request.postData();
				if (!rawPayload) {
					await route.continue();
					return;
				}

				try {
					const parsedPayload = JSON.parse(rawPayload);
					const batch = Array.isArray(parsedPayload?.batch)
						? parsedPayload.batch
						: [];
					const updatesSearch = batch.some(
						(action: any) =>
							action?.method === "$set" && action?.params?.[0] === "search",
					);
					if (updatesSearch) await sleep(700);
				} catch {}

				await route.continue();
			});

			await page.goto(`${baseUrl}/kirewire/search`);

			const searchInput = page.getByPlaceholder("Search users...");
			const searchField = page.locator(".relative", { has: searchInput });
			const loadingSpinner = searchField.locator(
				"span.loading.loading-spinner.loading-xs",
			);

			await expect(loadingSpinner).toBeHidden();

			await searchInput.fill("user37@example.com");

			await expect(loadingSpinner).toBeVisible();
			await expect(page.getByRole("cell", { name: "User 37" })).toBeVisible();
			await expect(loadingSpinner).toBeHidden();
		});

		test("wire:navigate troca paginas com history e progresso", async ({
			page,
		}) => {
			await page.goto(`${baseUrl}/kirewire`);

			const sidebar = page.locator("aside");
			await sidebar.getByRole("link", { name: "Feature Tour" }).click();
			await expect(page).toHaveURL(`${baseUrl}/kirewire/features`);
			await expect(
				page.getByRole("heading", { name: "Feature Tour" }),
			).toBeVisible();
			await expect(page.locator("#kirewire-navigate-progress")).toHaveCount(1);

			await sidebar.getByRole("link", { name: "Todo List" }).click();
			await expect(page).toHaveURL(`${baseUrl}/kirewire/todo`);
			await expect(
				page.getByRole("heading", { name: "Todo List" }),
			).toBeVisible();

			await page.goBack();
			await expect(page).toHaveURL(`${baseUrl}/kirewire/features`);
			await expect(
				page.getByRole("heading", { name: "Feature Tour" }),
			).toBeVisible();

			await page.goBack();
			await expect(page).toHaveURL(`${baseUrl}/kirewire`);
			await expect(
				page.getByRole("heading", { name: "KireWire Playground" }),
			).toBeVisible();
		});

		test("infinity renderiza conteudo inicial e carrega mais itens ao intersectar", async ({
			page,
		}) => {
			await page.goto(`${baseUrl}/kirewire/infinity`);

			await expect(
				page.getByRole("heading", { name: "Infinite Scroll Example" }),
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: /^Item 1$/ }),
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: /^Item 10$/ }),
			).toBeVisible();

			const sentinel = page.locator('div[wire\\:intersect="loadMore"]');
			await sentinel.scrollIntoViewIfNeeded();
			await expect(
				page.getByRole("heading", { name: /^Item 11$/ }),
			).toBeVisible();
		});

		test("wire:poll interrompe chamadas apos remover componente do DOM", async ({
			page,
		}) => {
			let pollCalls = 0;

			page.on("request", (request) => {
				if (!request.url().includes("/_wire") || request.method() !== "POST")
					return;

				const rawPayload = request.postData();
				if (!rawPayload) return;

				try {
					const parsedPayload = JSON.parse(rawPayload);
					const batch = Array.isArray(parsedPayload?.batch)
						? parsedPayload.batch
						: [];
					const hasPollIncrement = batch.some(
						(action: any) => action?.method === "increment",
					);
					if (hasPollIncrement) pollCalls += 1;
				} catch {}
			});

			await page.goto(`${baseUrl}/kirewire/stress`);
			await expect.poll(() => pollCalls >= 3).toBe(true);

			const removed = await page.evaluate(() => {
				const heading = Array.from(document.querySelectorAll("h2, h3")).find(
					(node) => String(node.textContent || "").trim() === "Poll Stress",
				);
				const host = heading?.closest(".card") || heading?.parentElement;
				if (!host) return false;
				host.remove();
				return !host.isConnected;
			});

			expect(removed).toBe(true);
			await expect(
				page.getByRole("heading", { name: /^Poll Stress$/ }),
			).toHaveCount(0);

			const countAfterRemoval = pollCalls;
			await page.waitForTimeout(1200);

			// One extra in-flight request is acceptable, but polling must stop.
			expect(pollCalls - countAfterRemoval).toBeLessThanOrEqual(1);
		});

		test("chat envia mensagem com username defer e limpa input", async ({
			page,
		}) => {
			await page.goto(`${baseUrl}/kirewire/chat`);

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

			await page.goto(`${baseUrl}/kirewire/users`);
			await expect(
				page.getByRole("heading", { name: /Usuarios \(\d+\)/ }),
			).toBeVisible();
			await expect(page.getByText("Page 1 of 5")).toBeVisible();

			await page.goto(`${baseUrl}/kirewire/upload`);
			await expect(
				page.getByRole("heading", { name: "File Upload with Validation" }),
			).toBeVisible();

			expect(pageErrors).toEqual([]);
		});

		test("stream, shared e toast funcionam", async ({ page }) => {
			const pageErrors: string[] = [];
			page.on("pageerror", (err) => pageErrors.push(err.message));

			await page.goto(`${baseUrl}/kirewire/stream`);
			const streamButton = page.getByRole("button", { name: "Add Log Stream" });
			const streamItems = page.locator('div[wire\\:stream="logs"] pre');

			await streamButton.click();
			await expect(streamItems).toHaveCount(1);

			await streamButton.click();
			await expect(streamItems).toHaveCount(2);
			await expect(
				page.getByText("Log at", { exact: false }).first(),
			).toBeVisible();

			await page.goto(`${baseUrl}/kirewire/shared-components`);
			const counter = page.locator(".stat-value").first();
			const initialCounter = Number.parseInt(
				(await counter.textContent()) || "0",
				10,
			);
			await page
				.getByRole("button", { name: "Increment Shared Counter" })
				.click();
			await expect(counter).toHaveText(String(initialCounter + 1));

			await page.goto(`${baseUrl}/kirewire/toast`);
			await page.getByRole("button", { name: "Show Success" }).click();
			await expect(
				page.getByText("Operation successful!").first(),
			).toBeVisible();

			expect(pageErrors).toEqual([]);
		});

		test("wire:collection atualiza listas x-for sem html do componente", async ({
			page,
		}) => {
			const observedResponses: any[] = [];
			page.on("response", async (response) => {
				if (
					!response.url().includes("/_wire") ||
					response.request().method() !== "POST"
				)
					return;
				try {
					observedResponses.push(await response.json());
				} catch {}
			});

			await page.goto(`${baseUrl}/kirewire/collection`);

			const input = page.getByPlaceholder(
				"Add an entry and keep the DOM stable",
			);
			const addButton = page.getByRole("button", { name: "Add Entry" });
			const entryText = "collection-e2e-entry";

			await input.fill(entryText);
			await addButton.click();

			await expect(page.getByText(entryText)).toBeVisible();
			await expect(input).toHaveValue("");

			let matchedResult: any = null;
			await expect
				.poll(() => {
					for (let i = 0; i < observedResponses.length; i++) {
						const list = Array.isArray(observedResponses[i])
							? observedResponses[i]
							: [observedResponses[i]];
						const match = list.find(
							(item: any) =>
								Array.isArray(item?.effects) &&
								item.effects.some(
									(effect: any) => effect?.type === "collection",
								),
						);
						if (match) {
							matchedResult = match;
							return 1;
						}
					}
					return 0;
				})
				.toBe(1);

			expect(matchedResult?.html).toBe("");
			expect(
				matchedResult?.effects?.some(
					(effect: any) =>
						effect?.type === "collection" &&
						effect?.payload?.name === "entries" &&
						effect?.payload?.action === "prepend",
				),
			).toBe(true);
		});
	});
}
