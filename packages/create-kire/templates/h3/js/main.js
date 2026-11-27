import { join } from "node:path";
import { kireH3 } from "@kirejs/h3";
import { Kirewire } from "@kirejs/wire";
import { H3, serve } from "h3";
import { Counter } from "./counter.js";

const wire = new Kirewire({ secret: process.env.APP_SECRET });
wire.component(Counter);

const { view, middleware } = kireH3({
	views: join(import.meta.dirname, "views"),
	wire: { instance: wire },
});

const user = { name: "Ada Lovelace", role: "admin" };

const app = new H3();
app.use(middleware); // serves the Kirewire endpoints
app.get("/", () => view("home", { title: "h3 + Kire" }));
app.get("/about", () => view("pages.about"));
app.get("/counter", () => view("counter"));
app.get("/showcase", () =>
	view("showcase", {
		tags: ["kire", "h3", "ssr", "reactive"],
		user,
		userJson: JSON.stringify(user, null, 2),
	}),
);

const port = Number(process.env.PORT) || 3000;
serve(app, { port });
console.log(`h3 + Kire on http://localhost:${port}`);
