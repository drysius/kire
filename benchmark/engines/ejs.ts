import { workerData } from "node:worker_threads";
import ejs from "ejs";
import { runBenchmark } from "./base.js";

async function main() {
    const { scenario, data } = workerData;
    await runBenchmark(() => ejs.render(scenario.templates.ejs, data));
}

main();
