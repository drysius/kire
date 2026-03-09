const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/wire",
	version: "0.1.0",
	description: "Kirewire framework inspirated in Livewire api with kire module.",
	author: "",
	repository: "",
	dependencies: ["@sinclair/typebox","kire"],
	handle: async (kire) => {
		try {
		const { KirewirePlugin } = await import("@kirejs/wire");
					if (typeof KirewirePlugin === "function") {
						kire.use(new KirewirePlugin({ secret: "kire-schema" }));
					}
		} catch (_error) {}
	},
});
