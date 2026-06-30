import { config } from "#app/config";
import { buildApp } from "#app/http/kernel";

/** Boot the HTTP server. */
export async function serve(): Promise<void> {
	const app = await buildApp();
	app.listen({ port: config.server.port, hostname: config.server.host });
	console.log(`\n  ${config.app.name} docs → http://localhost:${config.server.port}\n`);
}
