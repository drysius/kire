import { WireCore } from "../core";

export const Elysiawire = (app: any) => {
	const core = WireCore.get();
	const options = core.getOptions();
	const route = options.route || "/_kirewire";

	app.post(route, async ({ body, request, set, store }: any) => {
		try {
			const response = await core.handleRequest(body, {
				req: request,
				user: store?.user,
			});

			if (response.error) {
				set.status = 400;
				return response;
			}
			return response;
		} catch (e: any) {
			console.error(e);
			set.status = 500;
			return { error: e.message };
		}
	});

	return app;
};
