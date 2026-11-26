/**
 * Kirewire client runtime entry point. Bootstraps component discovery, directive
 * binding, and the transport, then exposes a small global API on `window.Kirewire`.
 */

import type { ServerPush, Transport } from "../contracts";
import { createDefaultDirectives, type DirectiveRegistry } from "./directives";
import { setupNavigate } from "./navigate";
import { WireRuntime } from "./runtime";
import { HttpTransport, SseTransport, WebSocketTransport } from "./transport";

export { ClientComponent } from "./component";
export { createDefaultDirectives, DirectiveRegistry } from "./directives";
export { morph } from "./morph";
export { setupNavigate } from "./navigate";
export { computed, effect, reactive, watch } from "./reactivity";
export { WireRuntime } from "./runtime";
export {
	FiveMTransport,
	HttpTransport,
	SseTransport,
	WebSocketTransport,
} from "./transport";
export { evaluate, makeWire } from "./wire";

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
	/** Enable `wire:navigate` SPA link navigation. Default true. */
	navigate?: boolean;
	/**
	 * Integrate with Alpine.js: after each server-driven morph, re-run
	 * `Alpine.initTree(el)` so Alpine directives in the new HTML initialize.
	 * Defaults to auto-detect (`window.Alpine`). Wrap persistent Alpine islands
	 * in `wire:ignore` so the morph leaves their state intact.
	 */
	alpine?: boolean;
}

/** Public global API. */
export interface KirewireGlobal {
	runtime: WireRuntime;
	start(): void;
	find(id: string): ReturnType<WireRuntime["components"]["get"]>;
}

/** Create a runtime, discover components, and begin handling interactions. */
export function start(opts: StartOptions = {}): WireRuntime {
	const transport: Transport =
		opts.transport ?? new HttpTransport(opts.url ?? "/_wire", opts.token);
	const runtime = new WireRuntime({
		transport,
		directives: opts.directives ?? createDefaultDirectives(),
	});

	const boot = () => {
		runtime.start();
		if (opts.navigate !== false) setupNavigate(runtime);
		setupAlpine(opts.alpine);
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

/**
 * Wire Kirewire's morphs into Alpine.js. After each component re-render,
 * `Alpine.initTree()` runs on the morphed subtree so Alpine directives in the
 * server-rendered HTML are initialized. Enabled when `alpine` is true, or by
 * default when `window.Alpine` is present.
 */
function setupAlpine(enabled?: boolean): void {
	if (typeof window === "undefined") return;
	// biome-ignore lint/suspicious/noExplicitAny: Alpine is an optional global
	const w = window as any;
	const use = enabled ?? !!w.Alpine;
	if (!use) return;
	window.addEventListener("kirewire:morphed", (event) => {
		const el = (event as CustomEvent).detail?.el as Element | undefined;
		if (el && w.Alpine?.initTree) w.Alpine.initTree(el);
	});
}
