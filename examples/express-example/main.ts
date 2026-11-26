import { join } from "node:path";
import express from "express";
// In your own app this is: import { kireExpress } from "@kirejs/express";
import { kireExpress } from "../../packages/express/src/index";

const app = express();

// Idiomatic Express: one middleware sets up the view engine and res.view().
app.use(
	kireExpress({
		views: join(import.meta.dirname, "views"),
		globals: { features: ["Blade-style syntax", "components", "dotted paths"] },
	}),
);

// Classic EJS/Eta-style view engine:
app.get("/", (_req, res) => res.render("home", { title: "Express + Kire" }));

// res.view() renders a dotted view path and sends HTML directly:
app.get("/about", (_req, res) => res.view("pages.about"));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Express + Kire on http://localhost:${port}`));
