import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { glob } from "glob";

export interface PackageInfo {
	name: string;
	version: string;
	path: string;
	publishPath: string;
	scripts?: Record<string, string>;
	json: any;
}

export async function getPackages(): Promise<PackageInfo[]> {
	const packagePaths = await glob(["core", "packages/*", "vs-kire"]);
	const packages = new Map<string, PackageInfo>();

	for (const packagePath of packagePaths) {
		if (!existsSync(`${packagePath}/package.json`)) continue;

		const pkgJsonPath = `${packagePath}/package.json`;
		const content = await readFile(pkgJsonPath, "utf-8");
		const pkg = JSON.parse(content);

		// Normalize path for consistent handling
		const normalizedPath = packagePath.replace(/\\/g, "/");

		let publishPath = "";
		if (normalizedPath === "core") {
			publishPath = `publish/core`;
		} else {
			publishPath = `publish/${normalizedPath}`;
		}

		packages.set(pkg.name, {
			name: pkg.name,
			version: pkg.version,
			path: normalizedPath,
			publishPath,
			scripts: pkg.scripts,
			json: pkg,
		});
	}

	// Sort: 'kire' (core) first
	const sortedPackages = Array.from(packages.values()).sort((a, b) => {
		if (a.name === "kire") return -1;
		if (b.name === "kire") return 1;
		return 0;
	});

	return sortedPackages;
}
