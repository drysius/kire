import { Edge } from "edge.js";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

const TEMPLATE_NAME = "__benchmark_edge_template__";

export async function createRunner(
	payload: BenchmarkPayload,
): Promise<BenchmarkRunner> {
	const { scenario, data } = payload;
	const edge = new Edge({ cache: true });
	edge.registerTemplate(TEMPLATE_NAME, { template: scenario.templates.edge });

	// First render compiles/caches the template outside benchmark loop.
	await edge.render(TEMPLATE_NAME, data);
	return () => edge.render(TEMPLATE_NAME, data);
}
