import { parentPort, workerData } from "node:worker_threads";
import type { BenchmarkPayload } from "../engines/base.ts";
import { executeBenchmarkPayload } from "./runner.ts";

async function main() {
    try {
        const payload = workerData as BenchmarkPayload;
        const result = await executeBenchmarkPayload(payload);
        parentPort?.postMessage(result);
    } catch (error: any) {
        parentPort?.postMessage({
            error: error?.message || String(error),
            stack: error?.stack,
        });
    }
}

void main();
