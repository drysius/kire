const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/iconify",
	version: "0.1.2",
	description: "Iconify integration for Kire.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["kire"],
	handle: async (kire) => {
		try {
		const { default: KireIconify } = await import("@kirejs/iconify");
					if (KireIconify) kire.use(KireIconify);
		} catch (_error) {}
	},
});
