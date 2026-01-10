import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { inc } from "semver";
import { getPackages, type PackageInfo } from "./utils";

class Publisher {
	private readonly CLI = "\x1b[34mCLI\x1b[0m";
	private readonly VERSION = "\x1b[32mVERSION\x1b[0m";
	private readonly PUBLISH = "\x1b[35mPUBLISH\x1b[0m";

	private async updateVersion(pkg: PackageInfo): Promise<void> {
		const pkgPath = join(pkg.path, "package.json");
		const content = await readFile(pkgPath, "utf-8");
		const pkgJson = JSON.parse(content);

		const newVersion = inc(pkgJson.version, "patch");
		if (!newVersion) {
			throw new Error(`Failed to increment version for ${pkg.name}`);
		}

		console.log(
			`${this.VERSION} Updating ${pkg.name} from ${pkgJson.version} to ${newVersion}`,
		);
		pkgJson.version = newVersion;

		await writeFile(pkgPath, `${JSON.stringify(pkgJson, null, 2)}\n`);
		console.log(`${this.VERSION} Updated ${pkgPath}`);
	}

	private async publishPackage(pkg: PackageInfo): Promise<void> {
		try {
			// Read latest version from file
			const content = await readFile(join(pkg.path, "package.json"), "utf-8");
			const pkgJson = JSON.parse(content);

			console.log(`${this.PUBLISH} Publishing ${pkg.name}@${pkgJson.version}`);

			await $`npm publish --access public`.cwd(pkg.publishPath);

			console.log(
				`${this.PUBLISH} Successfully published ${pkg.name}@${pkgJson.version}`,
			);
		} catch (error) {
			console.error(`${this.PUBLISH} Failed to publish ${pkg.name}:`, error);
			throw error;
		}
	}

	public async publish(): Promise<void> {
		try {
			const packages = await getPackages();
			console.log(`${this.CLI} Found ${packages.length} packages`);

			for (const pkg of packages) {
				await this.updateVersion(pkg);
			}

			console.log(`${this.CLI} Running build...`);
			await $`bun run build`;
			console.log(`${this.CLI} Build completed`);

			for (const pkg of packages) {
				await this.publishPackage(pkg);
			}

			console.log(`${this.CLI} All packages have been published successfully!`);
		} catch (error) {
			console.error(`${this.CLI} Failed to publish packages:`, error);
			process.exit(1);
		}
	}
}

const publisher = new Publisher();
publisher.publish().catch(console.error);
