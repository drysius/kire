/** HTTP server binding. */
export const server = {
	port: Number(process.env.PORT ?? 3000),
	host: process.env.HOST ?? "0.0.0.0",
} as const;

export type ServerConfig = typeof server;
