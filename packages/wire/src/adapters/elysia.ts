import {
	createVanillaWireAdapter,
	type VanillaWireAdapterOptions,
} from "./vanilla";

export function ElysiaAdapter(app: any, options: VanillaWireAdapterOptions) {
	const adapter = createVanillaWireAdapter(options);

	app.all(`${adapter.route}*`, async (context: any) => {
		const output = await adapter.handle({
			request: context,
			method: String(context?.request?.method || "GET"),
			url: String(context?.request?.url || ""),
			body: context?.body,
			signal: context?.request?.signal,
		});

		const headers = (output?.headers || {}) as Record<string, string>;
		for (const [name, value] of Object.entries(headers)) {
			context.set.headers[name] = value as any;
		}
		context.set.status = Number(output?.status || 200);
		return output?.result;
	});

	return app;
}

export { ElysiaAdapter as ElysiaPlugin };
