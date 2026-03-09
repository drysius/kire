import nunjucks from "nunjucks";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(payload: BenchmarkPayload): Promise<BenchmarkRunner> {
    const { scenario, data } = payload;
    const env = new nunjucks.Environment(undefined as any, {
        autoescape: true,
        throwOnUndefined: false,
    });
    const compiled = nunjucks.compile(scenario.templates.nunjucks, env);

    return () => compiled.render(data);
}
