import { app } from "./app";
import { docs } from "./docs";
import { server } from "./server";

/**
 * Composed application configuration. Import the slice you need:
 *
 * ```ts
 * import { config, isProd } from "#app/config";
 * config.app.name; config.server.port;
 * ```
 */
export const config = { app, server, docs } as const;

export const isProd = () => config.app.env === "production";

export { app, server, docs };
