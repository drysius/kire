import { Elysia } from "elysia";
import { config } from "#app/config";
import { html } from "#app/http/response";
import { kire } from "#app/providers/kire";
import { navGroups } from "#app/services/content";

/** Landing page. */
export default new Elysia({ name: "home" }).get("/", async () =>
	html(
		await kire().view("pages.home", {
			title: "Documentation",
			app: config.app,
			docs: config.docs,
			nav: navGroups(),
		}),
	),
);
