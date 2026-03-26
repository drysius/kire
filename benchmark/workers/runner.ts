import type { BenchmarkPayload } from "../engines/base.ts";
import { runBenchmark } from "../engines/base.ts";
import { createEngineRunner } from "../engines/registry.ts";

export async function executeBenchmarkPayload(payload: BenchmarkPayload) {
	const runner = await createEngineRunner(payload);
	return await runBenchmark(payload, runner);
}
