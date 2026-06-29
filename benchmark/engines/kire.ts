import { Kire } from "../../core/dist/index.js";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(
	payload: BenchmarkPayload,
): Promise<BenchmarkRunner> {
	const { scenario, data } = payload;
	const kire = new Kire({ production: true, async: false });
	const compiled = kire.compile(
		scenario.templates.kire,
		"__benchmark_kire__.kire",
	);

	if (!compiled.fn) {
		throw new Error("Kire compile did not return an executable function.");
	}

	return () => kire.run(compiled.fn!, data);
}
