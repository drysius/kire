import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateBar(value: number, max: number, length = 20) {
	if (max === 0) return "-".repeat(length);
	const filled = Math.min(length, Math.round((value / max) * length));
	return "#".repeat(filled) + "-".repeat(length - filled);
}

function main() {
	const resultsDir = join(__dirname, "results");
	if (!existsSync(resultsDir)) {
		console.error("Results directory not found.");
		return;
	}

	const files = readdirSync(resultsDir)
		.filter((file) => file.startsWith("results-") && file.endsWith(".json"))
		.sort();

	let markdown = "# Kire Performance Benchmarks\n\n";
	markdown +=
		"This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. ";
	markdown +=
		"Benchmarks are executed in isolated worker processes to ensure fair comparisons. ";
	markdown +=
		"Templates are precompiled once per engine before the timed loop.\n\n";
	markdown += `Generated on: ${new Date().toUTCString()}\n\n`;

	const allData: any[] = files.map((file) =>
		JSON.parse(readFileSync(join(resultsDir, file), "utf-8")),
	);

	for (const runtimeData of allData) {
		markdown += `## Runtime: ${String(runtimeData.runtime).toUpperCase()}\n\n`;
		const failures = Array.isArray(runtimeData.failures)
			? runtimeData.failures
			: [];

		if (failures.length > 0) {
			markdown += "> Benchmark failures detected for this runtime:\n";
			for (const failure of failures) {
				markdown += `> - ${failure.scenario}/${failure.engine}: ${failure.message}\n`;
			}
			markdown += "\n";
		}

		for (const scenario of runtimeData.scenarios || []) {
			markdown += `### Scenario: ${scenario.name} (${scenario.dataCount} items, ${scenario.iterations} iterations)\n\n`;
			markdown += "| Engine | Ops/sec | Speed | Visual |\n";
			markdown += "| :--- | :--- | :--- | :--- |\n";

			const engines = Object.entries(scenario.engines || {}).sort(
				(a: any, b: any) => (b[1]?.opsPerSec || 0) - (a[1]?.opsPerSec || 0),
			);
			const maxOps =
				engines.length > 0 ? (engines[0]![1] as any).opsPerSec || 0 : 0;

			if (engines.length === 0) {
				markdown += "| _No successful benchmark results_ | - | - | - |\n\n";
				continue;
			}

			for (const [name, stats] of engines as Array<[string, any]>) {
				const ops = Number(stats?.opsPerSec || 0);
				const ratio = maxOps > 0 ? ops / maxOps : 0;
				const speed =
					ratio === 1 ? "**Fastest**" : `${(ratio * 100).toFixed(1)}%`;
				markdown += `| ${name} | ${ops.toLocaleString()} | ${speed} | \`${generateBar(ops, maxOps)}\` |\n`;
			}
			markdown += "\n";
		}
	}

	markdown +=
		"---\n*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*\n";

	const rootDir = join(__dirname, "..");
	writeFileSync(join(rootDir, "BENCHMARK.md"), markdown);
	console.log("BENCHMARK.md generated successfully at root.");
}

main();
