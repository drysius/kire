const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/wirold",
	version: "0.1.0",
	description: "Linked Framework: Granular reactivity for Kire components.",
	author: "",
	repository: "",
	dependencies: ["@sinclair/typebox","kire"],
	handle: async (kire) => {
		try {
		const { default: wirePlugin } = await import("@kirejs/wirold");
					if (wirePlugin) kire.use(wirePlugin);
		} catch (_error) {}
	},
});
