import { wireAttributeDocs, wireElementDocs } from "./schema.docs.js";

const defineSchema = (schema) => schema;

export default defineSchema({
	name: "@kirejs/wire",
	version: "0.1.0",
	description:
		"Reactive component runtime for Kire with Livewire-style server actions and DOM updates.",
	author: "drysius",
	repository: "git+https://github.com/drysius/kire.git",
	dependencies: ["@sinclair/typebox", "kire"],
	elements: wireElementDocs,
	attributes: wireAttributeDocs,
	handle: async (kire) => {
		try {
			const { KirewirePlugin } = await import("@kirejs/wire");
			if (typeof KirewirePlugin === "function") {
				kire.use(new KirewirePlugin({ secret: "kire-schema" }));
			}
		} catch (_error) {}
	},
});
