/** Artisan-like CLI dispatcher: `bun run console <command>`. */
const commands: Record<string, () => Promise<unknown>> = {
	serve: () => import("./serve").then((m) => m.serve()),
};

const name = process.argv[2] ?? "serve";
const command = commands[name];

if (!command) {
	console.error(`Unknown command "${name}". Available: ${Object.keys(commands).join(", ")}`);
	process.exit(1);
}

await command();
