import path from "node:path";
import { fileURLToPath } from "node:url";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { config } from "#app/config";
import { registerWeb } from "#app/routes/web";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC_DIR = path.resolve(PACKAGE_ROOT, "public");

/** Build the HTTP application: static assets, error envelope, and web routes. */
export async function buildApp(): Promise<Elysia> {
	const app = new Elysia();

	app.onError(({ code, error, set }) => {
		set.headers["content-type"] = "text/html; charset=utf-8";
		const status = code === "NOT_FOUND" ? 404 : 500;
		set.status = status;
		const message = error instanceof Error ? error.message : String(error);
		return `<!doctype html><html data-theme="${config.docs.theme.dark}"><body class="min-h-screen grid place-items-center bg-base-200">
			<div class="card bg-base-100 shadow-xl max-w-lg"><div class="card-body">
				<h1 class="card-title text-error">${status} — ${code}</h1>
				<p class="opacity-70">${escapeHtml(message)}</p>
				<a href="/" class="btn btn-primary btn-sm mt-2 w-fit">Back home</a>
			</div></div></body></html>`;
	});

	app.use(staticPlugin({ assets: PUBLIC_DIR, prefix: "/public" }));
	await registerWeb(app);
	return app;
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
