import Handlebars from "handlebars";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(
	payload: BenchmarkPayload,
): Promise<BenchmarkRunner> {
	const { scenario, data } = payload;
	const compiled = Handlebars.compile(scenario.templates.handlebars, {
		noEscape: false,
	});

	return () => compiled(data);
}
