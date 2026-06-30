/** Application identity and global metadata. */
export const app = {
	name: "Kire",
	tagline: "Compile-to-JavaScript template engine for people who own their templates.",
	description:
		"Kire parses .kire templates, compiles them to optimized JS functions, and renders fast. Plus Kirewire reactive components, Tailwind, markdown, and more.",
	url: process.env.APP_URL ?? "http://localhost:3000",
	env: process.env.NODE_ENV ?? "development",
	repo: "https://github.com/drysius/kire",
	version: "0.1.0",
} as const;

export type AppConfig = typeof app;
