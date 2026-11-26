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

export interface GetPackagesOptions {
	includeExtensions?: boolean;
	includeApps?: boolean;
	publishableOnly?: boolean;
}

const BASE_PACKAGE_PATTERNS = ["core", "packages/*"];
const EXTENSION_PACKAGE_PATTERNS = ["vs-kire"];
const APP_PACKAGE_PATTERNS = ["MultiChat"];

function isVsCodeExtensionPackage(pkgJson: any): boolean {
	return !!pkgJson?.engines?.vscode;
}

function isPublishablePackage(pkgJson: any): boolean {
	if (pkgJson?.private === true) return false;
	if (isVsCodeExtensionPackage(pkgJson)) return false;
	return true;
}

export async function getPackages(
	options: GetPackagesOptions = {},
): Promise<PackageInfo[]> {
	const {
		includeExtensions = false,
		includeApps = false,
		publishableOnly = false,
	} = options;

	const patterns = [...BASE_PACKAGE_PATTERNS];
	if (includeExtensions) patterns.push(...EXTENSION_PACKAGE_PATTERNS);
	if (includeApps) patterns.push(...APP_PACKAGE_PATTERNS);

	const packagePaths = await glob(patterns, { windowsPathsNoEscape: true });
	const packages = new Map<string, PackageInfo>();

	for (const packagePath of packagePaths) {
		if (!existsSync(`${packagePath}/package.json`)) continue;

		const pkgJsonPath = `${packagePath}/package.json`;
		const content = await readFile(pkgJsonPath, "utf-8");
		const pkg = JSON.parse(content);
		if (publishableOnly && !isPublishablePackage(pkg)) continue;

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

	// Sort so dependencies build first: core (`kire`), then `@kirejs/wire`
	// (every integration package depends on it), then the rest alphabetically.
	const rank = (name: string) =>
		name === "kire" ? 0 : name === "@kirejs/wire" ? 1 : 2;
	const sortedPackages = Array.from(packages.values()).sort((a, b) => {
		const ra = rank(a.name);
		const rb = rank(b.name);
		if (ra !== rb) return ra - rb;
		return a.name.localeCompare(b.name);
	});

	return sortedPackages;
}
