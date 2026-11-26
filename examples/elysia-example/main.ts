import { join } from "node:path";
import { Elysia } from "elysia";
// In your own app these import from "@kirejs/elysia" / "@kirejs/wire".
import { kireElysia } from "../../packages/elysia/src/index";
import { Kirewire } from "../../packages/wire/src/index";
import { Counter } from "./counter";

const wire = new Kirewire({ secret: "example-secret" });
wire.component(Counter);

const user = { name: "Ada Lovelace", role: "admin" };
const port = Number(process.env.PORT) || 3000;

new Elysia()
	.use(kireElysia({ views: join(import.meta.dirname, "views"), wire: { instance: wire } }))
	// biome-ignore lint/suspicious/noExplicitAny: context is augmented by the plugin
	.get("/", ({ view }: any) => view("home", { title: "Elysia + Kire" }))
	// biome-ignore lint/suspicious/noExplicitAny: context is augmented by the plugin
	.get("/about", ({ view }: any) => view("pages.about"))
	// biome-ignore lint/suspicious/noExplicitAny: context is augmented by the plugin
	.get("/counter", ({ view }: any) => view("counter"))
	.get(
		"/showcase",
		// biome-ignore lint/suspicious/noExplicitAny: context is augmented by the plugin
		({ view }: any) =>
			view("showcase", {
				tags: ["kire", "elysia", "ssr", "reactive"],
				user,
				userJson: JSON.stringify(user, null, 2),
			}),
	)
	.listen(port, () => console.log(`Elysia + Kire on http://localhost:${port}`));
