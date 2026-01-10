import { WireCore } from "../core";

export const Honowire = () => {
	const core = WireCore.get();
	const options = core.getOptions();
	const route = options.route || "/_kirewire";

	return (c: any, next: any) => {
		if (c.req.method === "POST" && c.req.path === route) {
			return (async () => {
				try {
					const body = await c.req.json();
					const response = await core.handleRequest(body, {
						req: c.req,
						res: c.res,
						user: c.get("user"),
					});

					if (response.error) {
						return c.json(response, 400);
					}
					return c.json(response);
				} catch (e: any) {
					console.error(e);
					return c.json({ error: e.message }, 500);
				}
			})();
		}
		return next();
	};
};
