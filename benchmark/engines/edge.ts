import { workerData } from "node:worker_threads";
import { Edge } from "edge.js";
import { runBenchmark } from "./base.js";

async function main() {
    const { scenario, data } = workerData;
    const edge = new Edge({ cache: true });
    
    await runBenchmark(() => edge.renderRaw(scenario.templates.edge, data));
}

main();
