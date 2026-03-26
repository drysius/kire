export interface BenchmarkScenario {
	name: string;
	iterations: number;
	dataCount: number;
	templates: Record<string, string>;
}

export interface BenchmarkPayload {
	engineName: string;
	scenario: BenchmarkScenario;
	data: Record<string, any>;
}

export interface BenchmarkResult {
	engineName: string;
	totalMs: number;
	warmupMs: number;
	iterations: number;
	opsPerSec: number;
}

export type BenchmarkRunner = () => any | Promise<any>;

async function execute(runner: BenchmarkRunner) {
	const result = runner();
	if (result instanceof Promise) {
		await result;
	}
}

export async function runBenchmark(
	payload: BenchmarkPayload,
	runner: BenchmarkRunner,
): Promise<BenchmarkResult> {
	const warmupIterations = 10;

	const warmupStart = performance.now();
	for (let i = 0; i < warmupIterations; i++) {
		await execute(runner);
	}
	const warmupEnd = performance.now();

	const start = performance.now();
	for (let i = 0; i < payload.scenario.iterations; i++) {
		await execute(runner);
	}
	const end = performance.now();

	const totalMs = end - start;
	return {
		engineName: payload.engineName,
		totalMs,
		warmupMs: warmupEnd - warmupStart,
		iterations: payload.scenario.iterations,
		opsPerSec: Math.round((payload.scenario.iterations / totalMs) * 1000),
	};
}
