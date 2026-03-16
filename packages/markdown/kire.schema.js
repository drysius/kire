const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/markdown",
	version: "0.1.2",
	description: "Markdown plugin for Kire.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["kire", "marked"],
	handle: async (kire) => {
		try {
			const { default: KireMarkdown } = await import("@kirejs/markdown");
			if (KireMarkdown) kire.use(KireMarkdown);
		} catch (_error) {}
	},
});
