/**
 * Kirewire client runtime entry point. Bootstraps component discovery, directive
 * binding, and the transport, then exposes a small global API on `window.Kirewire`.
 */
import { WireRuntime } from "./runtime";
import { createDefaultDirectives, DirectiveRegistry } from "./directives";
import { HttpTransport, SseTransport, WebSocketTransport } from "./transport";
import type { ServerPush, Transport } from "../contracts";

export { WireRuntime } from "./runtime";
export { ClientComponent } from "./component";
export { DirectiveRegistry, createDefaultDirectives } from "./directives";
export { HttpTransport, SseTransport, WebSocketTransport } from "./transport";
export { reactive, effect, computed, watch } from "./reactivity";
export { morph } from "./morph";
export { makeWire, evaluate } from "./wire";

export interface StartOptions {
	/** Update endpoint for the HTTP transport. */
	url?: string;
	/** CSRF/session token sent with every request. */
	token?: string;
	/** Provide a transport explicitly (e.g. SSE/WebSocket); overrides `url`. */
	transport?: Transport;
	/** Custom directive registry; defaults to the built-ins. */
	directives?: DirectiveRegistry;
	/** Subscribe to a server-push channel on start (SSE/WebSocket transports). */
	channel?: string;
}

/** Public global API. */
export interface KirewireGlobal {
	runtime: WireRuntime;
	start(): void;
	find(id: string): ReturnType<WireRuntime["components"]["get"]>;
}

/** Create a runtime, discover components, and begin handling interactions. */
export function start(opts: StartOptions = {}): WireRuntime {
	const transport: Transport = opts.transport ?? new HttpTransport(opts.url ?? "/_wire", opts.token);
	const runtime = new WireRuntime({
		transport,
		directives: opts.directives ?? createDefaultDirectives(),
	});

	const boot = () => {
		runtime.start();
		if (opts.channel && transport.subscribe) {
			transport.subscribe(opts.channel, (push: ServerPush) => {
				const target = push.to ? runtime.components.get(push.to) : undefined;
				if (target) target.applyResponse(target.snapshot, push.effects);
				else runtime.dispatch({ event: "broadcast", params: [push.effects] });
			});
		}
	};

	if (typeof document !== "undefined") {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", boot, { once: true });
		} else {
			boot();
		}
	}

	if (typeof window !== "undefined") {
		(window as unknown as { Kirewire: KirewireGlobal }).Kirewire = {
			runtime,
			start: boot,
			find: (id) => runtime.components.get(id),
		};
	}

	return runtime;
}
