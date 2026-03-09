const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/auth",
	version: "0.1.2",
	description: "Authentication directives for Kire.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["kire"],
	handle: async (kire) => {
		try {
		const { default: KireAuth } = await import("@kirejs/auth");
					if (KireAuth) kire.use(KireAuth);
		} catch (_error) {}
	},
});
