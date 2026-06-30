import type { Kire } from "kire";
import type { Broadcaster, ServerPush, UpdateRequest } from "../contracts";
import type { Kirewire } from "../kirewire";

/**
 * FiveM bridge for Kirewire.
 *
 * In FiveM, NUI (the browser UI) talks to the resource's client script via
 * `fetch("https://<resource>/<callback>")` answered by `RegisterNuiCallback`, and
 * the client pushes to NUI via `SendNuiMessage`. This module adapts Kirewire to
 * that model without importing any FiveM globals — the host wires them in.
 *
 * ```ts
 * // client script (FiveM JS runtime)
 * import { Kirewire } from "@kirejs/wire";
 * import { createFiveMHandler, FiveMBroadcaster } from "@kirejs/wire";
 *
 * const hub = new FiveMBroadcaster((json) => SendNuiMessage(json));
 * const wire = new Kirewire({ secret: GetConvar("wire_secret", "…"), broadcaster: hub });
 * wire.component(MyComponent);
 *
 * RegisterNuiCallback("_wire", createFiveMHandler(wire));
 * ```
 */

/** Signature of a FiveM `RegisterNuiCallback` handler. */
export type NuiCallback = (data: unknown, cb: (response: unknown) => void) => void;

/**
 * Build a `RegisterNuiCallback` handler that runs the Kirewire update pipeline and
 * returns the response through the NUI callback (which becomes the `fetch` body).
 */
export function createFiveMHandler(
	kirewire: Kirewire,
	engineFactory?: () => Kire<boolean>,
): NuiCallback {
	return (data, cb) => {
		Promise.resolve(kirewire.handle(data as UpdateRequest, engineFactory?.()))
			.then((response) => cb(response))
			.catch(() => cb({ v: 1, components: [] }));
	};
}

/**
 * A {@link Broadcaster} that pushes frames to NUI via `SendNuiMessage`. Pass it as
 * `Kirewire({ broadcaster })`; the matching client `FiveMTransport` receives the
 * frames through `window`'s `message` event.
 */
export class FiveMBroadcaster implements Broadcaster {
	constructor(private readonly sendNuiMessage: (json: string) => void) {}

	publish(push: ServerPush): void {
		this.sendNuiMessage(JSON.stringify({ type: "kirewire:push", push }));
	}
}
