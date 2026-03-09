import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";
import { createRunner as createKireRunner } from "./kire.ts";
import { createRunner as createKireElementsRunner } from "./kire_elements.ts";
import { createRunner as createKireComponentsRunner } from "./kire_components.ts";
import { createRunner as createEjsRunner } from "./ejs.ts";
import { createRunner as createEdgeRunner } from "./edge.ts";
import { createRunner as createHandlebarsRunner } from "./handlebars.ts";
import { createRunner as createNunjucksRunner } from "./nunjucks.ts";
import { createRunner as createPugRunner } from "./pug.ts";

export type RunnerFactory = (
    payload: BenchmarkPayload,
) => Promise<BenchmarkRunner> | BenchmarkRunner;

const registry: Record<string, RunnerFactory> = {
    kire: createKireRunner,
    kire_elements: createKireElementsRunner,
    kire_components: createKireComponentsRunner,
    ejs: createEjsRunner,
    "edge.js": createEdgeRunner,
    edge: createEdgeRunner,
    handlebars: createHandlebarsRunner,
    nunjucks: createNunjucksRunner,
    pug: createPugRunner,
};

export async function createEngineRunner(payload: BenchmarkPayload) {
    const key = payload.engineName.trim().toLowerCase();
    const factory = registry[key];
    if (!factory) {
        throw new Error(`Engine "${payload.engineName}" is not registered.`);
    }
    return await factory(payload);
}
