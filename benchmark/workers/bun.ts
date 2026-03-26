/// <reference lib="webworker" />
import type { BenchmarkPayload } from "../engines/base.ts";
import { executeBenchmarkPayload } from "./runner.ts";

type BunWorkerMessage = { result: any } | { error: string; stack?: string };

self.onmessage = async (event: MessageEvent<BenchmarkPayload>) => {
	const payload = event.data;
	let response: BunWorkerMessage;

	try {
		const result = await executeBenchmarkPayload(payload);
		response = { result };
	} catch (error: any) {
		response = {
			error: error?.message || String(error),
			stack: error?.stack,
		};
	}

	self.postMessage(response);
};
