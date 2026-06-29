import { Elysia, t } from "elysia";
import { config } from "#app/config";
import { html } from "#app/http/response";
import { kire } from "#app/providers/kire";
import { findByRoute, navGroups, neighbors, search } from "#app/services/content";

/** Documentation pages + search. */
export default new Elysia({ name: "docs" })
	// Live search (used by the navbar search component).
	.get(
		"/search",
		({ query }) =>
			search(String(query.q ?? "")).map((p) => ({
				route: p.route,
				title: p.title,
				description: p.description,
				section: p.section,
			})),
		{ query: t.Object({ q: t.Optional(t.String()) }) },
	)
	// First doc page is the default /docs entry.
	.get("/docs", ({ redirect }) => {
		const first = navGroups()[0]?.items[0];
		return redirect(first?.route ?? "/");
	})
	// Any doc article.
	.get("/docs/*", async ({ params, set }) => {
		const route = `/docs/${(params as Record<string, string>)["*"]}`.replace(/\/$/, "");
		const page = findByRoute(route);
		if (!page) {
			set.status = 404;
			return html(
				await kire().view("pages.not-found", {
					title: "Not found",
					app: config.app,
					route,
					nav: navGroups(),
				}),
				404,
			);
		}
		const content = await kire().mdrender(page.body);
		return html(
			await kire().view("pages.doc", {
				title: page.title,
				app: config.app,
				docs: config.docs,
				nav: navGroups(),
				page,
				content,
				neighbors: neighbors(route),
			}),
		);
	});
