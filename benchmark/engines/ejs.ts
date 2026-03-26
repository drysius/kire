import ejs from "ejs";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(
	payload: BenchmarkPayload,
): Promise<BenchmarkRunner> {
	const { scenario, data } = payload;
	const compiled = ejs.compile(scenario.templates.ejs, {
		rmWhitespace: false,
		compileDebug: false,
	});

	return () => compiled(data);
}
