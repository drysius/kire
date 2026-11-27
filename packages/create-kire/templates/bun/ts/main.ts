import { join } from "node:path";
import { kireBun } from "@kirejs/bun";
import { Kirewire } from "@kirejs/wire";
import { Counter } from "./counter";

const wire = new Kirewire({ secret: process.env.APP_SECRET });
wire.component(Counter);

const kire = kireBun({
	views: join(import.meta.dirname, "views"),
	wire: { instance: wire },
});

const user = { name: "Ada Lovelace", role: "admin" };
const port = Number(process.env.PORT) || 3000;

Bun.serve({
	port,
	async fetch(req, server) {
		const res = await kire.wire(req, server);
		if (res !== null) return res;

		const { pathname } = new URL(req.url);
		if (pathname === "/") return kire.view("home", { title: "Bun + Kire" });
		if (pathname === "/about") return kire.view("pages.about");
		if (pathname === "/counter") return kire.view("counter");
		if (pathname === "/showcase")
			return kire.view("showcase", {
				tags: ["kire", "bun", "ssr", "reactive"],
				user,
				userJson: JSON.stringify(user, null, 2),
			});
		return new Response("Not Found", { status: 404 });
	},
	websocket: kire.websocket,
});

console.log(`Bun + Kire on http://localhost:${port}`);
