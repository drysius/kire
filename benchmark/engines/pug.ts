import pug from "pug";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(payload: BenchmarkPayload): Promise<BenchmarkRunner> {
    const { scenario, data } = payload;
    const compiled = pug.compile(scenario.templates.pug, {
        compileDebug: false,
        pretty: false,
        inlineRuntimeFunctions: true,
    });

    return () => compiled(data);
}
