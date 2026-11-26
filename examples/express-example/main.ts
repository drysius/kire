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
		wire: { instance: wire },
	}),
);

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
