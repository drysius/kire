import { Kire } from "../../core/dist/index.js";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(payload: BenchmarkPayload): Promise<BenchmarkRunner> {
    const { scenario, data } = payload;
    const template =
        scenario.templates.kire_components || scenario.templates.kire || "";

    const kire = new Kire({
        production: true,
        async: false,
        files: {
            "component.kire": "<div>I am Component Implementation</div>",
        },
    });
    const compiled = kire.compile(
        template,
        "__benchmark_kire_components__.kire",
    );

    if (!compiled.fn) {
        throw new Error("Kire Components compile did not return an executable function.");
    }

    return () => kire.run(compiled.fn!, data);
}
