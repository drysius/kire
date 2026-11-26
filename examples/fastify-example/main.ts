import { join } from "node:path";
import Fastify from "fastify";
// In your own app this is: import { kireFastify } from "@kirejs/fastify";
import { kireFastify } from "../../packages/fastify/src/index";

const app = Fastify();

// Idiomatic Fastify: register the plugin; it adds reply.view().
app.register(
	kireFastify({
		views: join(import.meta.dirname, "views"),
		globals: { features: ["Blade-style syntax", "components", "dotted paths"] },
	}),
);

app.get("/", (_req, reply) => reply.view("home", { title: "Fastify + Kire" }));
app.get("/about", (_req, reply) => reply.view("pages.about"));

const port = Number(process.env.PORT) || 3000;
app.listen({ port }).then((addr) => console.log(`Fastify + Kire on ${addr}`));
