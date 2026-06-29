import { handleUpdate } from "@kirejs/wire";
import { Elysia } from "elysia";
import { config } from "#app/config";
import { html } from "#app/http/response";
import { kire } from "#app/providers/kire";
import { navGroups } from "#app/services/content";
import { wire } from "#app/wire";

/** Kirewire update endpoint + the live playground page. */
export default new Elysia({ name: "wire" })
	.post("/_wire", async ({ body, set }) => {
		const result = await handleUpdate(wire, body as never, kire().fork());
		set.status = result.status;
		set.headers["content-type"] = "application/json";
		return result.body;
	})
	.get("/docs/wire/playground", async () =>
		html(
			await kire().view("pages.playground", {
				title: "Live Playground",
				app: config.app,
				docs: config.docs,
				nav: navGroups(),
			}),
		),
	);
