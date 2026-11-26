import { join } from "node:path";
import { kireExpress } from "@kirejs/express";
import { Kirewire } from "@kirejs/wire";
import express from "express";
import { Counter } from "./counter.js";

const wire = new Kirewire({ secret: process.env.APP_SECRET ?? "change-me" });
wire.component(Counter);

const app = express();
app.use(express.json());
app.use(kireExpress({ views: join(import.meta.dirname, "views"), wire: { instance: wire } }));

const user = { name: "Ada Lovelace", role: "admin" };

app.get("/", (_req, res) => res.render("home", { title: "Express + Kire" }));
app.get("/about", (_req, res) => res.view("pages.about"));
app.get("/counter", (_req, res) => res.view("counter"));
app.get("/showcase", (_req, res) =>
	res.view("showcase", {
		tags: ["kire", "express", "ssr", "reactive"],
		user,
		userJson: JSON.stringify(user, null, 2),
	}),
);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Express + Kire on http://localhost:${port}`));
