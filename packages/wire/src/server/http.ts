import type { Kire } from "kire";
import type { UpdateRequest, UpdateResponse } from "../contracts";
import { Kirewire, CorruptSnapshotError } from "../kirewire";

export interface HttpResult {
	status: number;
	body: UpdateResponse | { error: string };
}

/**
 * Framework-agnostic core of the update endpoint. Parses/handles a raw request
 * body and returns a status + JSON body. Framework adapters (Express, Elysia, …)
 * only need to read the body, call this, and write the result.
 *
 * `engine` is an optional request-scoped Kire fork used to render component views
 * during the update (pass `kire.fork()` per request).
 */
export async function handleUpdate(
	kirewire: Kirewire,
	rawBody: string | UpdateRequest,
	engine?: Kire<boolean>,
): Promise<HttpResult> {
	let request: UpdateRequest;
	try {
		request = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
	} catch {
		return { status: 400, body: { error: "Invalid JSON body." } };
	}
	if (!request || !Array.isArray(request.components)) {
		return { status: 400, body: { error: "Malformed update request." } };
	}

	try {
		const response = await kirewire.handle(request, engine);
		return { status: 200, body: response };
	} catch (error) {
		if (error instanceof CorruptSnapshotError) {
			// Generic status; never reveal why verification failed.
			return { status: 419, body: { error: "Page expired." } };
		}
		return { status: 500, body: { error: "Component update failed." } };
	}
}

/** A minimal Node `(req, res)` handler for the update endpoint. */
export function nodeHttpAdapter(kirewire: Kirewire, engineFactory?: () => Kire<boolean>) {
	return async (
		req: { on(ev: string, cb: (chunk: unknown) => void): void; method?: string },
		res: {
			statusCode: number;
			setHeader(k: string, v: string): void;
			end(body?: string): void;
		},
	): Promise<void> => {
		const chunks: Buffer[] = [];
		req.on("data", (c) => chunks.push(c as Buffer));
		await new Promise<void>((resolve) => req.on("end", () => resolve()));
		const body = Buffer.concat(chunks).toString("utf8");
		const result = await handleUpdate(kirewire, body, engineFactory?.());
		res.statusCode = result.status;
		res.setHeader("content-type", "application/json");
		res.end(JSON.stringify(result.body));
	};
}
