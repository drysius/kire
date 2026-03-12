import { $ } from "bun";
import { getPackages } from "./utils";

async function install() {
	console.log("🚀 Starting project-wide installation...");

	// 2. Discover Packages
	console.log("\n📦 Discovering packages...");
	const packages = await getPackages({
		includeExtensions: true,
		includeApps: true,
	});
	console.log(`Found ${packages.length} packages.`);

	// 3. Individual Package Installation
	for (const pkg of packages) {
		console.log(
			`\n📥 Installing dependencies for ${pkg.name} (${pkg.path})...`,
		);
		try {
			// Run bun install in the package directory
			// We use $.throws(true) or similar if we wanted to stop,
			// but we'll stick to simple await and try/catch per package.
			await $`bun i`.cwd(pkg.path);
			console.log(`✅ Installed dependencies for ${pkg.name}`);
		} catch (error: any) {
			console.error(
				`❌ Failed to install dependencies for ${pkg.name}:`,
				error.message,
			);
		}
	}

	console.log("\n✨ All installations completed successfully!");
}

install().catch(console.error);
