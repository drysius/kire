import { join } from "node:path";
import { serve } from "@hono/node-server";
import { kireHono } from "@kirejs/hono";
import { Kirewire } from "@kirejs/wire";
import { Hono } from "hono";
import { Counter } from "./counter.js";

const wire = new Kirewire({ secret: process.env.APP_SECRET });
wire.component(Counter);

const app = new Hono();
app.use(kireHono({ views: join(import.meta.dirname, "views"), wire: { instance: wire } }));

const user = { name: "Ada Lovelace", role: "admin" };

app.get("/", (c) => c.var.view("home", { title: "Hono + Kire" }));
app.get("/about", (c) => c.var.view("pages.about"));
app.get("/counter", (c) => c.var.view("counter"));
app.get("/showcase", (c) =>
	c.var.view("showcase", {
		tags: ["kire", "hono", "ssr", "reactive"],
		user,
		userJson: JSON.stringify(user, null, 2),
	}),
);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, (info) =>
	console.log(`Hono + Kire on http://localhost:${info.port}`),
);
