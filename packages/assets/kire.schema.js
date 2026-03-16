const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/assets",
	version: "0.1.2",
	description: "Assets management plugin for Kire.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["kire"],
	handle: async (kire) => {
		try {
			const { default: KireAssets } = await import("@kirejs/assets");
			if (KireAssets) kire.use(KireAssets);
		} catch (_error) {}
	},
});
