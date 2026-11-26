import { join } from "node:path";
import { kireElysia } from "@kirejs/elysia";
import { Kirewire } from "@kirejs/wire";
import { Elysia } from "elysia";
import { Counter } from "./counter";

const wire = new Kirewire({ secret: process.env.APP_SECRET ?? "change-me" });
wire.component(Counter);

const user = { name: "Ada Lovelace", role: "admin" };
const port = Number(process.env.PORT) || 3000;

new Elysia()
	.use(kireElysia({ views: join(import.meta.dirname, "views"), wire: { instance: wire } }))
	.get("/", ({ view }) => view("home", { title: "Elysia + Kire" }))
	.get("/about", ({ view }) => view("pages.about"))
	.get("/counter", ({ view }) => view("counter"))
	.get("/showcase", ({ view }) =>
		view("showcase", {
			tags: ["kire", "elysia", "ssr", "reactive"],
			user,
			userJson: JSON.stringify(user, null, 2),
		}),
	)
	.listen(port, () => console.log(`Elysia + Kire on http://localhost:${port}`));
