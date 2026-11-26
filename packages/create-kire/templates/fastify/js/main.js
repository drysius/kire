import { join } from "node:path";
import { kireFastify } from "@kirejs/fastify";
import { Kirewire } from "@kirejs/wire";
import Fastify from "fastify";
import { Counter } from "./counter.js";

const wire = new Kirewire({ secret: process.env.APP_SECRET ?? "change-me" });
wire.component(Counter);

const app = Fastify();
app.register(kireFastify({ views: join(import.meta.dirname, "views"), wire: { instance: wire } }));

const user = { name: "Ada Lovelace", role: "admin" };

app.get("/", (_req, reply) => reply.view("home", { title: "Fastify + Kire" }));
app.get("/about", (_req, reply) => reply.view("pages.about"));
app.get("/counter", (_req, reply) => reply.view("counter"));
app.get("/showcase", (_req, reply) =>
	reply.view("showcase", {
		tags: ["kire", "fastify", "ssr", "reactive"],
		user,
		userJson: JSON.stringify(user, null, 2),
	}),
);

const port = Number(process.env.PORT) || 3000;
app.listen({ port }).then((addr) => console.log(`Fastify + Kire on ${addr}`));
