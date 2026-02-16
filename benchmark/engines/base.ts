import { parentPort, workerData } from "node:worker_threads";

export async function runBenchmark(runner: () => any | Promise<any>) {
    const { engineName, scenario, data } = workerData;
    
    try {
        // Warmup
        for (let i = 0; i < 10; i++) {
            const res = runner();
            if (res instanceof Promise) await res;
        }

        // Benchmark
        const start = performance.now();
        for (let i = 0; i < scenario.iterations; i++) {
            const res = runner();
            if (res instanceof Promise) await res;
        }
        const end = performance.now();

        parentPort?.postMessage({
            engineName,
            totalMs: end - start,
            opsPerSec: Math.round((scenario.iterations / (end - start)) * 1000)
        });
    } catch (error: any) {
        parentPort?.postMessage({ error: error.message, stack: error.stack });
    }
}
