import { Kire } from "../../core/dist/index.js";
import type { BenchmarkPayload, BenchmarkRunner } from "./base.ts";

export async function createRunner(
	payload: BenchmarkPayload,
): Promise<BenchmarkRunner> {
	const { scenario, data } = payload;
	const template =
		scenario.templates.kire_components || scenario.templates.kire || "";

	const kire = new Kire({
		production: true,
		async: false,
	});
	kire.namespace("components", "components");
	kire.$files[kire.resolvePath("components.user-row")] = `
<li class="{{ user.active ? 'active' : '' }}">
    {{ user.name }} ({{ user.email }})
    @if(user.isAdmin)
        <span class="badge">Admin</span>
    @endif
</li>`.trim();
	const compiled = kire.compile(template, "__benchmark_kire_components__.kire");

	if (!compiled.fn) {
		throw new Error(
			"Kire Components compile did not return an executable function.",
		);
	}

	return () => kire.run(compiled.fn!, data);
}
