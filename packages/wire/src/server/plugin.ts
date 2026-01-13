import { randomUUID } from "node:crypto";
import type { Kire } from "kire";
import type {
	WireContext,
	WireOptions,
	WirePayload,
	WireResponse,
	WireSnapshot,
} from "../types";
import { WireComponent } from "./component";
import { ChecksumManager } from "./core/checksum";
import { attachContext } from "./core/context";
import { registerDirectives } from "./core/directives";
import { WireErrors } from "./core/errors";
import { processRequest } from "./core/process";
import { registry } from "./core/registry";

/**
 * Registers the Kirewire plugin with the Kire instance.
 * @param kire The Kire instance.
 * @param options Kirewire configuration options.
 */
export function Kirewire(kire: Kire, options = {} as WireOptions) {
	Kirewire.load(kire, options);
}

export namespace Kirewire {
	/** Package name constant */
	export const packageName = "@kirejs/wire";

	/** Standardized error responses */
	export const errors = WireErrors;

	/** Global configuration options */
	export let options: WireOptions = {
		method: "http",
		route: "/_kirewire",
		secret: randomUUID(),
		csrf: "csrf-token",
	};

	/** Checksum manager instance */
	export const checksum = new ChecksumManager(() => options.secret || "");

	/** Reference to the Kire instance */
	export let kireInstance: Kire | undefined;

	/** Compatibility helper for older tests */
	export function get() {
		return Kirewire;
	}

	/** Compatibility helper for older tests */
	export function init(kire: Kire, opts: Partial<WireOptions> = {}) {
		return load(kire, opts as never);
	}

	/**
	 * Registers a component with Kirewire.
	 * @param name The name of the component.
	 * @param component The component class.
	 */
	export function register(name: string, component: new () => WireComponent) {
		registry.register(name, component);
	}

	/** Compatibility helper for older tests */
	export function registerComponent(name: string, component: new () => WireComponent) {
		return register(name, component);
	}

	/** Compatibility helper for older tests */
	export function getChecksum() {
		return checksum;
	}

	/** Compatibility helper for older tests */
	export async function handleRequest(payload: WirePayload, contextOverrides: Partial<WireContext> = {}) {
		return (await process({ body: payload }, contextOverrides)).data;
	}

	/**
	 * Retrieves a registered component class by name.
	 * @param name The component name.
	 */
	export function getComponentClass(name: string) {
		return registry.get(name);
	}

	/**
	 * Loads the plugin and initializes directives.
	 * @param kire The Kire instance.
	 * @param opts Configuration options.
	 */
	export function load(kire: Kire, opts = {} as WireOptions) {
		kireInstance = kire;
		options = { ...options, ...opts };
		if (!options.secret) options.secret = randomUUID();

		const cache = kire.cached("@kirejs/wire");
		cache.set("options", options);
		// Update registry reference
		registry.setKire(kire);

		kire.$ctx("$wire", Kirewire);
		kire.$ctx("kire", kire);

		// Helper: kire.wire('name', Component)
		(kire as any).wire = (name: string, component: new () => WireComponent) => {
			register(name, component);
			return kire;
		};

		registerDirectives(kire, options);
	}

	/**
	 * Middleware-like function to attach the identifier to the request.
	 * Usage: app.use((req, res, next) => Kirewire.context(req, req.session.id, next));
	 *
	 * @param req The request object.
	 * @param identifier The session ID or user identifier (used for security).
	 * @param next Optional callback for middleware chains.
	 */
	export function context(req: any, identifier: string, next?: () => any) {
		return attachContext(req, identifier, next);
	}

	/**
	 * Validates if the payload structure is trustable.
	 * @param payload The request body.
	 */
	export function trust(payload: any): boolean {
		if (!payload || typeof payload !== "object") return false;
		// Allow empty snapshot as it might be an initial initialization request in some tests/scenarios
		return 'snapshot' in payload || 'component' in payload;
	}

	/**
	 * Processes the Kirewire request and returns the response.
	 * @param req The request object (must have been passed through `context`).
	 * @param contextOverrides Additional context to inject into the component (e.g. user).
	 */
	export async function process(
		req: any,
		contextOverrides: Partial<WireContext> = {},
	): Promise<{ code: number; data: WireResponse | { error: string } }> {
		if (!kireInstance) {
			return {
				code: 500,
				data: { error: "Kire instance not initialized" },
			};
		}
		return processRequest(
			req,
			kireInstance,
			registry,
			checksum,
			contextOverrides,
		);
	}
}

// Alias for tests
export const WireCore = Kirewire;