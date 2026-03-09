import { Kire } from "../../core/dist/index.js";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(payload: BenchmarkPayload): Promise<BenchmarkRunner> {
    const { scenario, data } = payload;
    const kire = new Kire({ production: true, async: false });
    const compiled = kire.compile(
        scenario.templates.kire_elements,
        "__benchmark_kire_elements__.kire",
    );

    if (!compiled.fn) {
        throw new Error("Kire Elements compile did not return an executable function.");
    }

    return () => kire.run(compiled.fn!, data);
}
