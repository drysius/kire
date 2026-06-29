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

// Consume the rendered output so the engine is forced to fully MATERIALIZE its
// result string. Engines that build output with `+=` produce a lazy rope
// (cons-string) whose `.length` is O(1); reading an actual character forces V8
// to flatten the rope — the real cost paid when the HTML is sent to a socket.
// Without this the benchmark measures lazy rope construction and over-reports
// throughput ~2x. The returned char also defeats dead-code elimination.
async function execute(runner: BenchmarkRunner): Promise<number> {
	let result = runner();
	if (result instanceof Promise) {
		result = await result;
	}
	if (typeof result === "string") {
		return result.length > 0 ? result.charCodeAt(result.length - 1) : 0;
	}
	return result == null ? 0 : 1;
}

export async function runBenchmark(
	payload: BenchmarkPayload,
	runner: BenchmarkRunner,
): Promise<BenchmarkResult> {
	const measured = payload.scenario.iterations;

	// Warm up generously so the JIT tiers the runner up to its optimized form
	// BEFORE measuring. The previous fixed 10-iteration warmup left measurement
	// happening mid-tiering, which made results swing ~20% run-to-run and let
	// tiny codegen differences dominate the numbers.
	const warmupIterations = Math.min(Math.max(measured, 2000), 50000);
	let checksum = 0;
	const warmupStart = performance.now();
	for (let i = 0; i < warmupIterations; i++) {
		checksum += await execute(runner);
	}
	const warmupEnd = performance.now();

	// Take the best (fastest) of several samples. The minimum is the run least
	// perturbed by GC pauses and OS scheduling, so it is the most stable signal.
	const samples = 5;
	let bestMs = Infinity;
	for (let s = 0; s < samples; s++) {
		const start = performance.now();
		for (let i = 0; i < measured; i++) {
			checksum += await execute(runner);
		}
		const elapsed = performance.now() - start;
		if (elapsed < bestMs) bestMs = elapsed;
	}
	// Reference the checksum so the engine output cannot be optimized away.
	if (!Number.isFinite(checksum)) throw new Error("benchmark checksum overflow");

	return {
		engineName: payload.engineName,
		totalMs: bestMs,
		warmupMs: warmupEnd - warmupStart,
		iterations: measured,
		opsPerSec: Math.round((measured / bestMs) * 1000),
	};
}
