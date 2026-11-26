import { join } from "node:path";
import { Elysia } from "elysia";
// In your own app this is: import { kireElysia } from "@kirejs/elysia";
import { kireElysia } from "../../packages/elysia/src/index";

const port = Number(process.env.PORT) || 3000;

new Elysia()
	.use(
		kireElysia({
			views: join(import.meta.dirname, "views"),
			globals: { features: ["Blade-style syntax", "components", "dotted paths"] },
		}),
	)
	// biome-ignore lint/suspicious/noExplicitAny: context is augmented by the plugin
	.get("/", ({ view }: any) => view("home", { title: "Elysia + Kire" }))
	// biome-ignore lint/suspicious/noExplicitAny: context is augmented by the plugin
	.get("/about", ({ view }: any) => view("pages.about"))
	.listen(port, () => console.log(`Elysia + Kire on http://localhost:${port}`));
