import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateBar(value: number, max: number, length = 20) {
    if (max === 0) return "░".repeat(length);
    const filled = Math.min(length, Math.round((value / max) * length));
    return "█".repeat(filled) + "░".repeat(length - filled);
}

function main() {
    const resultsDir = join(__dirname, "results");
    if (!existsSync(resultsDir)) {
        console.error("Results directory not found.");
        return;
    }
    const files = readdirSync(resultsDir).filter(f => f.startsWith("results-") && f.endsWith(".json"));

    let markdown = "# Kire Performance Benchmarks\n\n";
    markdown += "This report compares **Kire** with other popular template engines in various scenarios. ";
    markdown += "Benchmarks are executed in isolated worker processes to ensure fair comparisons.\n\n";
    markdown += `Generated on: ${new Date().toUTCString()}\n\n`;

    const allData: any[] = files.map(f => JSON.parse(readFileSync(join(resultsDir, f), 'utf-8')));

    for (const runtimeData of allData) {
        markdown += `## Runtime: ${runtimeData.runtime.toUpperCase()}\n\n`;

        for (const scenario of runtimeData.scenarios) {
            markdown += `### Scenario: ${scenario.name} (${scenario.dataCount} items, ${scenario.iterations} iterations)\n\n`;
            markdown += "| Engine | Ops/sec | Speed | Visual |\n";
            markdown += "| :--- | :--- | :--- | :--- |\n";

            const engines = Object.entries(scenario.engines).sort((a: any, b: any) => b[1].opsPerSec - a[1].opsPerSec);
            const maxOps = engines.length > 0 ? (engines[0]![1] as any).opsPerSec : 0;

            for (const [name, stats]: [string, any] of engines) {
                const ratio = maxOps > 0 ? stats.opsPerSec / maxOps : 0;
                const speed = ratio === 1 ? "**Fastest**" : `${(ratio * 100).toFixed(1)}%`;
                markdown += `| ${name} | ${stats.opsPerSec.toLocaleString()} | ${speed} | \`${generateBar(stats.opsPerSec, maxOps)}\` |\n`;
            }
            markdown += "\n";
        }
    }

    markdown += "---\n*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*\n";

    const rootDir = join(__dirname, "..");
    writeFileSync(join(rootDir, "BENCHMARK.md"), markdown);
    console.log("BENCHMARK.md generated successfully at root.");
}

main();
