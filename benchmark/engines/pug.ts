import { workerData } from "node:worker_threads";
import pug from "pug";
import { runBenchmark } from "./base.js";

async function main() {
    const { scenario, data } = workerData;
    
    await runBenchmark(() => pug.compile(scenario.templates.pug)(data));
}

main();
