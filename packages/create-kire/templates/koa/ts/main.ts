import { join } from "node:path";
import Router from "@koa/router";
import { kireKoa } from "@kirejs/koa";
import { Kirewire } from "@kirejs/wire";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { Counter } from "./counter";

const wire = new Kirewire({ secret: process.env.APP_SECRET });
wire.component(Counter);

const app = new Koa();
app.use(bodyParser()); // parses the Kirewire update body
app.use(kireKoa({ views: join(import.meta.dirname, "views"), wire: { instance: wire } }));

const user = { name: "Ada Lovelace", role: "admin" };
const router = new Router();

router.get("/", (ctx) => ctx.view("home", { title: "Koa + Kire" }));
router.get("/about", (ctx) => ctx.view("pages.about"));
router.get("/counter", (ctx) => ctx.view("counter"));
router.get("/showcase", (ctx) =>
	ctx.view("showcase", {
		tags: ["kire", "koa", "ssr", "reactive"],
		user,
		userJson: JSON.stringify(user, null, 2),
	}),
);
app.use(router.routes());

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Koa + Kire on http://localhost:${port}`));
