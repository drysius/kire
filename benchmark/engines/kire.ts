import { workerData } from "node:worker_threads";
import { Kire } from "../../core/dist/index.js";
import { runBenchmark } from "./base.js";

async function main() {
    const { scenario, data } = workerData;
    const kire = new Kire({ production: true, async:false });
    await runBenchmark(() => kire.render(scenario.templates.kire, data));
}

main();
