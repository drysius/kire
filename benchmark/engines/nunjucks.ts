import { workerData } from "node:worker_threads";
import nunjucks from "nunjucks";
import { runBenchmark } from "./base.js";

async function main() {
    const { scenario, data } = workerData;
    nunjucks.configure({ watch: false });
    
    await runBenchmark(() => nunjucks.renderString(scenario.templates.nunjucks, data));
}

main();
