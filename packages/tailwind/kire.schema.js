const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/tailwind",
	version: "0.1.2",
	description: "Tailwind plugin for Kire.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["kire","tailwindcss"],
	handle: async (kire) => {
		try {
		const { default: KireTailwind } = await import("@kirejs/tailwind");
					if (KireTailwind) kire.use(KireTailwind);
		} catch (_error) {}
	},
});
