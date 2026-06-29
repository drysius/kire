import type { Elysia } from "elysia";

/**
 * Web route table. Controllers default-export an Elysia plugin and are loaded
 * lazily, mirroring a Laravel `routes/web.php` registry.
 */
const controllers: Array<() => Promise<{ default: Elysia }>> = [
	() => import("#app/http/controllers/home"),
	() => import("#app/http/controllers/docs"),
];

export async function registerWeb(app: Elysia): Promise<void> {
	for (const load of controllers) {
		const { default: plugin } = await load();
		// biome-ignore lint/suspicious/noExplicitAny: Elysia plugin variance
		app.use(plugin as any);
	}
}
