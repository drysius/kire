import { workerData } from "node:worker_threads";
import Handlebars from "handlebars";
import { runBenchmark } from "./base.js";

async function main() {
    const { scenario, data } = workerData;
    
    await runBenchmark(() => Handlebars.compile(scenario.templates.handlebars)(data));
}

main();
