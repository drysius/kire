import { join } from "node:path";
import express from "express";
// In your own app these import from "@kirejs/express" / "@kirejs/wire".
import { kireExpress } from "../../packages/express/src/index";
import { Kirewire } from "../../packages/wire/src/index";
import { Counter } from "./counter";

// 1) A Kirewire server holds component state.
const wire = new Kirewire({ secret: "example-secret" });
wire.component(Counter);

const app = express();
app.use(express.json()); // required for the Kirewire update endpoint

// 2) One middleware: view engine + res.view + Kirewire endpoints + client script.
app.use(
	kireExpress({
		views: join(import.meta.dirname, "views"),
		globals: { features: ["Blade-style syntax", "components", "dotted paths"] },
		wire: { instance: wire },
	}),
);

// Classic EJS/Eta-style view engine:
app.get("/", (_req, res) => res.render("home", { title: "Express + Kire" }));
// Dotted view path helper:
app.get("/about", (_req, res) => res.view("pages.about"));
// Reactive Kirewire page:
app.get("/counter", (_req, res) => res.view("counter"));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Express + Kire on http://localhost:${port}`));
