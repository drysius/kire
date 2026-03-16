const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/vite",
	version: "0.1.0",
	description:
		"Vite integration for Kire with @vite runtime directive support.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["kire"],
	handle: async (kire) => {
		try {
			const { KireVite } = await import("@kirejs/vite");
			if (KireVite) kire.use(KireVite);
		} catch (_error) {}
	},
});
