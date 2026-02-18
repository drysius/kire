import { Worker } from "node:worker_threads";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateData(count: number) {
    return {
        users: Array.from({ length: count }, (_, i) => ({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            active: i % 2 === 0,
            isAdmin: i % 10 === 0
        })),
        title: "Benchmark Test"
    };
}
const templates = {
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
          span.badge Admin`.trim()
};

function runWorker(engineName: string, scenario: any, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const engineFile = engineName.toLowerCase().replace(".js", "");
        const workerPath = join(__dirname, "engines", `${engineFile}.ts`).replace(/\\/g, "/");
        const worker = new Worker(`
            const { register } = require('tsx/register');
            register();
            require('${workerPath}');
        `, {
            eval: true,
            workerData: { engineName, scenario, data, }
        });

        worker.on("message", (msg) => {
            if (msg.error) reject(msg);
            else resolve(msg);
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

// Special check for Bun because it can run TS workers directly
async function runWorkerBun(engineName: string, scenario: any, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const engineFile = engineName.toLowerCase().replace(".js", "");
        const worker = new Worker(join(__dirname, "engines", `${engineFile}.ts`), {
            workerData: { engineName, scenario, data }
        });
        worker.on("message", (msg) => {
            if (msg.error) reject(msg);
            else resolve(msg);
        });
        worker.on("error", reject);
    });
}

async function main() {
    const isBun = typeof Bun !== 'undefined';
    const runtime = isBun ? 'bun' : 'node';
    console.log(`Starting isolated benchmarks on ${runtime}...`);

    const scenarios = [
        { name: "Small Data", iterations: 10000, dataCount: 10, templates },
        { name: "Medium Data", iterations: 1000, dataCount: 100, templates },
        { name: "Large Data", iterations: 100, dataCount: 1000, templates }
    ];

    const allResults: any = {
        runtime,
        timestamp: new Date().toISOString(),
        scenarios: []
    };

    const engines = ["Kire", "Kire Elements","EJS", "Edge.js", "Handlebars", "Nunjucks", "Pug"];

    for (const s of scenarios) {
        console.log(`Scenario: ${s.name}...`);
        const scenarioResult: any = { ...s, engines: {} };
        delete scenarioResult.templates;

        const data = generateData(s.dataCount);

        for (let engine of engines) {
            engine = engine.toLocaleLowerCase().replace(" ", '_')
            try {
                process.stdout.write(`  - ${engine}... `);
                const result = isBun
                    ? await runWorkerBun(engine, s, data)
                    : await runWorker(engine, s, data);
                scenarioResult.engines[engine] = result;
                console.log(`${result.opsPerSec.toLocaleString()} ops/sec`);
            } catch (e: any) {
                console.log(`FAILED: ${e.error || e.message}`);
            }
        }
        allResults.scenarios.push(scenarioResult);
    }

    const resultsDir = join(__dirname, "results");
    if (!existsSync(resultsDir)) mkdirSync(resultsDir);

    writeFileSync(join(resultsDir, `results-${runtime}.json`), JSON.stringify(allResults, null, 2));
    console.log(`
Benchmarks completed. Results saved to benchmark/results/results-${runtime}.json`);
}

async function build() {
    await Bun.build({
        entrypoints:[path.join(process.cwd(), 'core/src/index.ts')],
        outdir:path.join(process.cwd(), 'core/dist')
    })
}

build().then(main).then(i => import('./report.ts')).catch(console.error);
