import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const exampleDir = resolve(repoRoot, "examples/wire-example");
const bunBin = process.platform === "win32" ? "bun.exe" : "bun";
const ignoredDirs = new Set([".git", "node_modules", "dist", "coverage", "playwright-report", "test-results"]);

function normalizePath(path: string) {
    return path.replaceAll("\\", "/");
}

function discoverPlaywrightFolders(rootDir: string): string[] {
    const found = new Set<string>();

    const walk = (currentDir: string) => {
        const entries = readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith(".")) continue;

            const fullPath = join(currentDir, entry.name);
            if (entry.isDirectory()) {
                if (ignoredDirs.has(entry.name)) continue;
                walk(fullPath);
                continue;
            }

            if (entry.isFile() && entry.name.endsWith(".e2e.ts")) {
                const normalized = normalizePath(fullPath);
                if (normalized.includes("/tests/")) found.add(dirname(fullPath));
            }
        }
    };

    walk(rootDir);
    return [...found].sort();
}

function runPlaywrightForFolder(testFolder: string) {
    const tempDir = mkdtempSync(join(tmpdir(), "kire-playwright-"));
    const configPath = join(tempDir, "playwright.config.mjs");

    const configSource = `
export default {
  testDir: ${JSON.stringify(testFolder)},
  testMatch: ["**/*.e2e.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  reporter: "list",
  use: { headless: true, trace: "retain-on-failure" }
};
`;

    writeFileSync(configPath, configSource, "utf8");

    const result = spawnSync(bunBin, ["x", "playwright", "test", "-c", configPath], {
        cwd: exampleDir,
        stdio: "inherit",
        shell: false,
        env: {
            ...process.env,
            PLAYWRIGHT_SUITE_DIR: testFolder,
        },
    });

    rmSync(tempDir, { recursive: true, force: true });
    return result.status ?? 1;
}

if (!existsSync(resolve(exampleDir, "package.json"))) {
    console.error(`[playwright] Example directory not found: ${exampleDir}`);
    process.exit(1);
}

const folders = discoverPlaywrightFolders(repoRoot);
if (folders.length === 0) {
    console.log("[playwright] No tests found in tests/**/*.e2e.ts");
    process.exit(0);
}

console.log(`[playwright] Found ${folders.length} suite folder(s).`);

let failures = 0;
for (const folder of folders) {
    const relative = normalizePath(folder).replace(`${normalizePath(repoRoot)}/`, "");
    console.log(`\n[playwright] Running suite: ${relative}`);
    const exitCode = runPlaywrightForFolder(folder);
    if (exitCode !== 0) failures++;
}

if (failures > 0) {
    console.error(`\n[playwright] ${failures} suite(s) failed.`);
    process.exit(1);
}

console.log("\n[playwright] All suites passed.");
