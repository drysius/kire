import { Worker as NodeWorker } from "node:worker_threads";
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path, { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchmarkPayload, BenchmarkScenario } from "./engines/base.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREATE_PATH = join(__dirname, "create.ts");

type RuntimeTarget = "node" | "bun" | "deno" | "both" | "all";
type RuntimeName = "node" | "bun" | "deno";

interface CliOptions {
    runtime: RuntimeTarget;
    skipBuild: boolean;
    prepareOnly: boolean;
    noReport: boolean;
    quick: boolean;
    engines?: string[];
}

function parseArgs(argv: string[]): CliOptions {
    const options: CliOptions = {
        runtime: "both",
        skipBuild: false,
        prepareOnly: false,
        noReport: false,
        quick: false,
    };

    for (const arg of argv) {
        if (arg.startsWith("--runtime=")) {
            const value = arg.slice("--runtime=".length).trim().toLowerCase();
            if (
                value === "node" ||
                value === "bun" ||
                value === "deno" ||
                value === "both" ||
                value === "all"
            ) {
                options.runtime = value;
            }
            continue;
        }

        if (arg.startsWith("--engines=")) {
            const raw = arg.slice("--engines=".length);
            const values = raw
                .split(",")
                .map((entry) => normalizeEngineName(entry))
                .filter(Boolean);
            options.engines = values.length > 0 ? Array.from(new Set(values)) : undefined;
            continue;
        }

        if (arg === "--skip-build") {
            options.skipBuild = true;
            continue;
        }
        if (arg === "--prepare-only") {
            options.prepareOnly = true;
            continue;
        }
        if (arg === "--no-report") {
            options.noReport = true;
            continue;
        }
        if (arg === "--quick") {
            options.quick = true;
            continue;
        }
    }

    return options;
}

function normalizeEngineName(engineName: string): string {
    return engineName.trim().toLowerCase().replace(/\s+/g, "_");
}

function generateData(count: number) {
    return {
        users: Array.from({ length: count }, (_, i) => ({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            active: i % 2 === 0,
            isAdmin: i % 10 === 0,
        })),
        title: "Benchmark Test",
    };
}

const templates: Record<string, string> = {
    kire: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        @for(user of users)
            <li class="{{ user.active ? 'active' : '' }}">
                {{ user.name }} ({{ user.email }})
                @if(user.isAdmin)
                    <span class="badge">Admin</span>
                @endif
            </li>
        @endfor
    </ul>
</div>`.trim(),
    kire_elements: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        <kire:for items="users" as="user">
            <li class="{{ user.active ? 'active' : '' }}">
                {{ user.name }} ({{ user.email }})
                <kire:if cond="user.isAdmin">
                    <span class="badge">Admin</span>
                </kire:if>
            </li>
        </kire:for>
    </ul>
</div>`.trim(),
    kire_components: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        @for(user of users)
            <x-user-row :user="user" />
        @endfor
    </ul>
</div>`.trim(),
    ejs: `
<div class="container">
    <h1><%= title %></h1>
    <ul>
        <% users.forEach(function(user){ %>
            <li class="<%= user.active ? 'active' : '' %>">
                <%= user.name %> (<%= user.email %>)
                <% if(user.isAdmin) { %>
                    <span class="badge">Admin</span>
                <% } %>
            </li>
        <% }) %>
    </ul>
</div>`.trim(),
    edge: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        @each(user in users)
            <li class="{{ user.active ? 'active' : '' }}">
                {{ user.name }} ({{ user.email }})
                @if(user.isAdmin)
                    <span class="badge">Admin</span>
                @endif
            </li>
        @endeach
    </ul>
</div>`.trim(),
    handlebars: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        {{#each users}}
            <li class="{{#if active}}active{{/if}}">
                {{name}} ({{email}})
                {{#if isAdmin}}
                    <span class="badge">Admin</span>
                {{/if}}
            </li>
        {{/each}}
    </ul>
</div>`.trim(),
    nunjucks: `
<div class="container">
    <h1>{{ title }}</h1>
    <ul>
        {% for user in users %}
            <li class="{% if user.active %}active{% endif %}">
                {{ user.name }} ({{ user.email }})
                {% if user.isAdmin %}
                    <span class="badge">Admin</span>
                {% endif %}
            </li>
        {% endfor %}
    </ul>
</div>`.trim(),
    pug: `
.container
  h1= title
  ul
    each user in users
      li(class=user.active ? 'active' : '')
        | #{user.name} (#{user.email})
        if user.isAdmin
          span.badge Admin`.trim(),
};

const defaultEngineNames = [
    "kire",
    "kire_elements",
    "kire_components",
    "ejs",
    "edge.js",
    "handlebars",
    "nunjucks",
    "pug",
];

function buildScenarios(quick: boolean): BenchmarkScenario[] {
    if (quick) {
        return [
            { name: "Small Data", iterations: 300, dataCount: 10, templates },
            { name: "Medium Data", iterations: 120, dataCount: 100, templates },
            { name: "Large Data", iterations: 30, dataCount: 1000, templates },
        ];
    }

    return [
        { name: "Small Data", iterations: 10000, dataCount: 10, templates },
        { name: "Medium Data", iterations: 1000, dataCount: 100, templates },
        { name: "Large Data", iterations: 100, dataCount: 1000, templates },
    ];
}

function formatDuration(totalSeconds: number): string {
    const safe = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${seconds}s`;
}

function buildCoreWithBun() {
    const entry = join(process.cwd(), "core", "src", "index.ts");
    const outDir = join(process.cwd(), "core", "dist");

    const result = spawnSync(
        "bun",
        ["build", entry, "--outdir", outDir, "--target", "node"],
        { stdio: "inherit" },
    );

    if (result.status !== 0) {
        throw new Error("Failed to compile core with Bun before benchmarks.");
    }
}

function runNodeWorker(payload: BenchmarkPayload): Promise<any> {
    return new Promise((resolve, reject) => {
        const workerPath = join(__dirname, "workers", "node.ts");
        const worker = new NodeWorker(workerPath, {
            workerData: payload,
            execArgv: ["--import", "tsx"],
        });

        worker.once("message", (msg) => {
            if (msg?.error) {
                reject(new Error(msg.error));
                return;
            }
            resolve(msg);
        });
        worker.once("error", reject);
        worker.once("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Node worker exited with code ${code}`));
            }
        });
    });
}

function runBunWorker(payload: BenchmarkPayload): Promise<any> {
    return new Promise((resolve, reject) => {
        if (typeof Worker === "undefined") {
            reject(
                new Error(
                    "Bun Worker is not available in this runtime. Execute runtime=bun with Bun.",
                ),
            );
            return;
        }

        const workerUrl = new URL("./workers/bun.ts", import.meta.url).href;
        const worker = new Worker(workerUrl, { type: "module" });

        worker.onmessage = (event: MessageEvent<any>) => {
            const msg = event.data;
            if (msg?.error) {
                reject(new Error(msg.error));
            } else {
                resolve(msg?.result);
            }
            worker.terminate();
        };
        worker.onerror = (event: any) => {
            reject(new Error(event?.message || "Bun worker error"));
            worker.terminate();
        };
        worker.postMessage(payload);
    });
}

function runDenoWorker(payload: BenchmarkPayload): Promise<any> {
    return new Promise((resolve, reject) => {
        const tempDir = join(__dirname, "results", ".tmp");
        if (!existsSync(tempDir)) {
            mkdirSync(tempDir, { recursive: true });
        }

        const payloadPath = join(
            tempDir,
            `payload-${process.pid}-${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}.json`,
        );

        try {
            writeFileSync(payloadPath, JSON.stringify(payload));

            const workerPath = join(__dirname, "workers", "deno.ts");
            const result = spawnSync(
                "deno",
                [
                    "run",
                    "--quiet",
                    "--allow-read",
                    "--allow-write",
                    "--allow-env",
                    "--allow-run",
                    "--allow-sys",
                    "--node-modules-dir=auto",
                    workerPath,
                    payloadPath,
                ],
                {
                    encoding: "utf-8",
                },
            );

            if (result.error) {
                reject(
                    new Error(
                        `Failed to spawn Deno worker: ${result.error.message}`,
                    ),
                );
                return;
            }

            if (result.status !== 0) {
                reject(
                    new Error(
                        result.stderr?.trim() ||
                            result.stdout?.trim() ||
                            "Deno worker failed.",
                    ),
                );
                return;
            }

            const stdout = result.stdout?.trim();
            if (!stdout) {
                reject(new Error("Deno worker produced no output."));
                return;
            }

            const message = JSON.parse(stdout) as
                | { result?: any; error?: string; stack?: string }
                | undefined;

            if (message?.error) {
                reject(new Error(message.error));
                return;
            }

            resolve(message?.result ?? message);
        } catch (error: any) {
            reject(error);
        } finally {
            rmSync(payloadPath, { force: true });
        }
    });
}

function writeResults(runtime: RuntimeName, allResults: any) {
    const resultsDir = join(__dirname, "results");
    if (!existsSync(resultsDir)) mkdirSync(resultsDir);
    writeFileSync(
        join(resultsDir, `results-${runtime}.json`),
        JSON.stringify(allResults, null, 2),
    );
}

async function runRuntimeBenchmarks(
    runtime: RuntimeName,
    scenarios: BenchmarkScenario[],
    engines: string[],
) {
    console.log(`Starting isolated benchmarks on ${runtime}...`);

    const allResults: any = {
        runtime,
        timestamp: new Date().toISOString(),
        scenarios: [],
        failures: [],
    };
    const failures: Array<{ scenario: string; engine: string; message: string }> = [];

    const startedAt = Date.now();
    const totalTasks = scenarios.length * engines.length;
    let completedTasks = 0;

    for (const scenario of scenarios) {
        console.log(`Scenario: ${scenario.name}...`);
        const scenarioResult: any = {
            name: scenario.name,
            iterations: scenario.iterations,
            dataCount: scenario.dataCount,
            engines: {},
        };
        const data = generateData(scenario.dataCount);

        for (const engineName of engines) {
            const payload: BenchmarkPayload = {
                engineName,
                scenario,
                data,
            };

            try {
                process.stdout.write(`  - ${engineName}... `);
                const result =
                    runtime === "node"
                        ? await runNodeWorker(payload)
                        : runtime === "bun"
                            ? await runBunWorker(payload)
                            : await runDenoWorker(payload);

                scenarioResult.engines[engineName] = result;
                completedTasks++;

                const elapsedSec = (Date.now() - startedAt) / 1000;
                const avgSec = completedTasks > 0 ? elapsedSec / completedTasks : 0;
                const remainingSec = avgSec * (totalTasks - completedTasks);

                console.log(
                    `${result.opsPerSec.toLocaleString()} ops/sec ` +
                        `(ETA ${formatDuration(remainingSec)})`,
                );
            } catch (error: any) {
                const message = error?.message || String(error);
                completedTasks++;
                failures.push({
                    scenario: scenario.name,
                    engine: engineName,
                    message,
                });
                const elapsedSec = (Date.now() - startedAt) / 1000;
                const avgSec = completedTasks > 0 ? elapsedSec / completedTasks : 0;
                const remainingSec = avgSec * (totalTasks - completedTasks);
                console.log(
                    `FAILED: ${message} ` +
                        `(ETA ${formatDuration(remainingSec)})`,
                );
            }
        }

        allResults.scenarios.push(scenarioResult);
    }

    allResults.failures = failures;
    writeResults(runtime, allResults);
    console.log(
        `Benchmarks for ${runtime} completed. Results saved to benchmark/results/results-${runtime}.json`,
    );

    if (failures.length > 0) {
        const formatted = failures
            .map((failure) => `${failure.scenario}/${failure.engine}: ${failure.message}`)
            .join("\n");
        throw new Error(`Benchmark runtime "${runtime}" had failures:\n${formatted}`);
    }
}

function runChildRuntime(
    runtime: RuntimeName,
    options: CliOptions,
) {
    const baseArgs = [
        CREATE_PATH,
        `--runtime=${runtime}`,
        "--skip-build",
        "--no-report",
    ];

    if (options.quick) {
        baseArgs.push("--quick");
    }
    if (options.engines && options.engines.length > 0) {
        baseArgs.push(`--engines=${options.engines.join(",")}`);
    }

    const child =
        runtime === "node"
            ? spawnSync("node", ["--import", "tsx", ...baseArgs], { stdio: "inherit" })
            : runtime === "bun"
                ? spawnSync("bun", ["run", ...baseArgs], { stdio: "inherit" })
                : spawnSync(
                    "deno",
                    [
                        "run",
                        "--allow-read",
                        "--allow-write",
                        "--allow-env",
                        "--allow-run",
                        "--allow-sys",
                        "--node-modules-dir=auto",
                        ...baseArgs,
                    ],
                    { stdio: "inherit" },
                );

    if (child.error) {
        throw new Error(
            `Failed to spawn ${runtime} benchmark subprocess: ${child.error.message}`,
        );
    }

    if (child.status !== 0) {
        throw new Error(`Failed to run ${runtime} benchmark subprocess.`);
    }
}

async function generateReportIfNeeded(noReport: boolean) {
    if (noReport) return;
    await import("./report.ts");
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (!options.skipBuild) {
        console.log("Compiling core with Bun...");
        buildCoreWithBun();
    }

    if (options.prepareOnly) {
        console.log("Core compilation completed (--prepare-only).");
        return;
    }

    const scenarios = buildScenarios(options.quick);
    const engines =
        options.engines && options.engines.length > 0
            ? options.engines
            : defaultEngineNames;

    const runtimes: RuntimeName[] =
        options.runtime === "all"
            ? ["node", "bun", "deno"]
            : options.runtime === "both"
                ? ["node", "bun"]
                : [options.runtime];

    if (runtimes.length > 1) {
        for (const runtime of runtimes) {
            runChildRuntime(runtime, options);
        }
        await generateReportIfNeeded(options.noReport);
        return;
    }

    await runRuntimeBenchmarks(runtimes[0]!, scenarios, engines);
    await generateReportIfNeeded(options.noReport);
}

void main().catch((error) => {
    console.error(error);
    process.exit(1);
});
