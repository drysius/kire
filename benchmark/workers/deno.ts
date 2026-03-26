import type { BenchmarkPayload } from "../engines/base.ts";
import { executeBenchmarkPayload } from "./runner.ts";

async function main() {
	const payloadPath = Deno.args[0];
	if (!payloadPath) {
		throw new Error("Missing benchmark payload path for Deno worker.");
	}

	const raw = await Deno.readTextFile(payloadPath);
	const payload = JSON.parse(raw) as BenchmarkPayload;
	const result = await executeBenchmarkPayload(payload);
	console.log(JSON.stringify({ result }));
}

void main().catch((error: any) => {
	console.log(
		JSON.stringify({
			error: error?.message || String(error),
			stack: error?.stack,
		}),
	);
	Deno.exit(1);
});
