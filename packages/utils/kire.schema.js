const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/utils",
	version: "0.1.2",
	description: "A collection of Laravel-like utilities (Route, Html, etc.) for Kire templates.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["kire"],
	handle: async (kire) => {
		try {
		const { default: KireUtils } = await import("@kirejs/utils");
					if (KireUtils) kire.use(KireUtils);
		} catch (_error) {}
	},
});
