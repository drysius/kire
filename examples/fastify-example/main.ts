import { join } from "node:path";
import Fastify from "fastify";
// In your own app these import from "@kirejs/fastify" / "@kirejs/wire".
import { kireFastify } from "../../packages/fastify/src/index";
import { Kirewire } from "../../packages/wire/src/index";
import { Counter } from "./counter";

// Fastify parses JSON bodies by default, so the Kirewire endpoint needs no extra setup.
const wire = new Kirewire({ secret: "example-secret" });
wire.component(Counter);

const app = Fastify();

app.register(
	kireFastify({
		views: join(import.meta.dirname, "views"),
		globals: { features: ["Blade-style syntax", "components", "dotted paths"] },
		wire: { instance: wire },
	}),
);

app.get("/", (_req, reply) => reply.view("home", { title: "Fastify + Kire" }));
app.get("/about", (_req, reply) => reply.view("pages.about"));
app.get("/counter", (_req, reply) => reply.view("counter"));

const port = Number(process.env.PORT) || 3000;
app.listen({ port }).then((addr) => console.log(`Fastify + Kire on ${addr}`));
