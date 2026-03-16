import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Kire } from "../src/kire";

const port = Number(process.env.CORE_E2E_PORT || 3210);
const tempRoot = join(import.meta.dir, "temp_views");
const pageTemplate = join(tempRoot, "page.kire");

if (!existsSync(tempRoot)) mkdirSync(tempRoot, { recursive: true });

writeFileSync(
	pageTemplate,
	`<main id="app">
    @if(show)
        <h1>Hello {{ name }}</h1>
    @else
        <h1>Hidden</h1>
    @end
    <ul>
        @for(item of items)
            <li class="item">{{ item }}</li>
        @end
    </ul>
</main>`,
);

const kire = new Kire({ root: tempRoot });

const server = Bun.serve({
	port,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/inline") {
			const message = url.searchParams.get("message") || "core e2e";
			const html = await kire.render(
				`<section id="inline">
    <p class="msg">{{ message.toUpperCase() }}</p>
</section>`,
				{ message },
			);

			return new Response(html as string, {
				headers: { "content-type": "text/html; charset=utf-8" },
			});
		}

		const showParam = url.searchParams.get("show");
		const nameParam = url.searchParams.get("name");
		const itemsParam = url.searchParams.get("items");

		const show = showParam === null ? true : showParam !== "0";
		const name = nameParam || "Playwright";
		const items = itemsParam
			? itemsParam
					.split(",")
					.map((item) => item.trim())
					.filter(Boolean)
			: ["A", "B", "C"];

		const html = await kire.view("page", {
			name,
			show,
			items,
		});

		return new Response(html.toString(), {
			headers: { "content-type": "text/html; charset=utf-8" },
		});
	},
});

console.log(`[core-e2e] READY http://127.0.0.1:${server.port}`);

const shutdown = () => {
	try {
		server.stop(true);
	} catch {}
	if (existsSync(tempRoot)) rmSync(tempRoot, { recursive: true, force: true });
	process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
