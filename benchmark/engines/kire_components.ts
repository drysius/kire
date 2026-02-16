import { workerData } from "node:worker_threads";
import { Kire } from "../../core/dist/index.js";
import { runBenchmark } from "./base.js";

async function main() {
    const { scenario, data } = workerData;
    const kire = new Kire({ production: true, async:false, files: {
        'component.kire': `<div>I am Component Implementation</div>`
    } });
    await runBenchmark(() => kire.render(scenario.templates.kire_components, data));
}

main();
