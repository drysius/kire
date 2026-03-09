import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getPackages } from "./utils";

function normalizeRepository(repository: any): string | undefined {
	if (!repository) return undefined;
	if (typeof repository === "string") return repository;
	if (typeof repository === "object") return repository.url;
	return String(repository);
}

type SchemaPlan = {
	handleBody: string;
};

function getSchemaPlan(packageName: string): SchemaPlan {
	switch (packageName) {
		case "@kirejs/assets":
			return {
				handleBody: `const { default: KireAssets } = await import(${JSON.stringify(packageName)});
			if (KireAssets) kire.use(KireAssets);`,
			};
		case "@kirejs/auth":
			return {
				handleBody: `const { default: KireAuth } = await import(${JSON.stringify(packageName)});
			if (KireAuth) kire.use(KireAuth);`,
			};
		case "@kirejs/iconify":
			return {
				handleBody: `const { default: KireIconify } = await import(${JSON.stringify(packageName)});
			if (KireIconify) kire.use(KireIconify);`,
			};
		case "@kirejs/markdown":
			return {
				handleBody: `const { default: KireMarkdown } = await import(${JSON.stringify(packageName)});
			if (KireMarkdown) kire.use(KireMarkdown);`,
			};
		case "@kirejs/tailwind":
			return {
				handleBody: `const { default: KireTailwind } = await import(${JSON.stringify(packageName)});
			if (KireTailwind) kire.use(KireTailwind);`,
			};
		case "@kirejs/utils":
			return {
				handleBody: `const { default: KireUtils } = await import(${JSON.stringify(packageName)});
			if (KireUtils) kire.use(KireUtils);`,
			};
		case "@kirejs/wire":
			return {
				handleBody: `const { KirewirePlugin } = await import(${JSON.stringify(packageName)});
			if (typeof KirewirePlugin === "function") {
				kire.use(new KirewirePlugin({ secret: "kire-schema" }));
			}`,
			};
		case "@kirejs/wirold":
			return {
				handleBody: `const { default: wirePlugin } = await import(${JSON.stringify(packageName)});
			if (wirePlugin) kire.use(wirePlugin);`,
			};
		default:
			return {
				handleBody: `const { default: plugin } = await import(${JSON.stringify(packageName)});
			if (plugin) kire.use(plugin);`,
			};
	}
}

function buildSchemaModuleSource(meta: {
	name: string;
	version: string;
	description?: string;
	author?: string;
	repository?: string;
	dependencies: string[];
}) {
	const plan = getSchemaPlan(meta.name);
	const handle = plan.handleBody
		.split("\n")
		.map((line) => `\t\t${line}`)
		.join("\n");

	return `const defineSchema = (schema) => schema;

export default defineSchema({
	name: ${JSON.stringify(meta.name)},
	version: ${JSON.stringify(meta.version)},
	description: ${JSON.stringify(meta.description || "")},
	author: ${JSON.stringify(meta.author || "")},
	repository: ${JSON.stringify(meta.repository || "")},
	dependencies: ${JSON.stringify(meta.dependencies || [])},
	handle: async (kire) => {
		try {
${handle}
		} catch (_error) {}
	},
});
`;
}

export async function generate() {
	console.log("Generating kire.schema.js files...");
	const packages = await getPackages();
	let failures = 0;

	for (const pkg of packages) {
		// We only care about packages/* schemas here.
		if (!pkg.path.startsWith("packages/")) {
			continue;
		}

		try {
			const outPath = join(pkg.path, "kire.schema.js");
			const source = buildSchemaModuleSource({
				name: pkg.json.name || pkg.name,
				version: pkg.version,
				description: pkg.json.description,
				author: pkg.json.author,
				repository: normalizeRepository(pkg.json.repository),
				dependencies: Object.keys(pkg.json.dependencies || {}),
			});
			await writeFile(outPath, source, "utf8");
			console.log(`Generated ${outPath}`);
		} catch (e) {
			failures++;
			console.error(`Failed generating schema for ${pkg.name}:`, e);
		}
	}

	if (failures > 0) {
		throw new Error(`Schema generation failed for ${failures} package(s).`);
	}
}

generate().catch((error) => {
	console.error(error);
	process.exit(1);
});
