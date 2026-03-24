import type { Kire } from "kire";
import type { Kirewire } from "../kirewire";
import { HttpAdapter } from "../methods/http";
import { SocketAdapter } from "../methods/socket";

export type VanillaWireAdapterOptions = {
	wire: Kirewire;
	kire: Kire;
	route?: string;
	socket?: boolean;
	method?: any;
	resolveUserId?: (request: any) => string;
	resolveSessionId?: (request: any, userId: string) => string;
};

export type VanillaWireAdapter = {
	route: string;
	method: any;
	handle: (input: {
		request: any;
		method: string;
		url: string;
		body?: any;
		signal?: AbortSignal;
	}) => Promise<{ status?: number; headers?: Record<string, string>; result?: any }>;
};

function normalizeRoute(route: string): string {
	const value = String(route || "/_wire").trim();
	if (!value) return "/_wire";
	const withSlash = value.startsWith("/") ? value : `/${value}`;
	return withSlash.replace(/\/+$/, "") || "/_wire";
}

function defaultUserIdResolver(request: any): string {
	const explicit = String(request?.user?.id || "").trim();
	if (explicit) return explicit;

	const fromSession = String(request?.session?.id || request?.sessionId || "").trim();
	if (fromSession) return fromSession;

	const fromCookie = String(request?.cookies?.session || "").trim();
	if (fromCookie) return fromCookie;

	return "guest";
}

function defaultSessionIdResolver(request: any, userId: string): string {
	const explicit = String(request?.wireKey || request?.sessionKey || "").trim();
	if (explicit) return explicit;

	const fromSession = String(request?.session?.id || request?.sessionId || "").trim();
	if (fromSession) return fromSession;

	return userId || "guest";
}

export function createVanillaWireAdapter(
	options: VanillaWireAdapterOptions,
): VanillaWireAdapter {
	if (!options?.wire) {
		throw new Error("Vanilla adapter requires a wire instance.");
	}
	if (!options?.kire) {
		throw new Error("Vanilla adapter requires a kire instance.");
	}

	const route = normalizeRoute(options.route || "/_wire");
	const method =
		options.method ||
		(options.socket
			? new SocketAdapter({ route })
			: new HttpAdapter({ route }));

	if (typeof method?.install !== "function") {
		throw new Error("Invalid wire method. Expected an install(wire, kire) function.");
	}
	if (typeof method?.handleRequest !== "function") {
		throw new Error("Invalid wire method. Expected a handleRequest(...) function.");
	}

	method.install(options.wire, options.kire);

	const resolveUserId = options.resolveUserId || defaultUserIdResolver;
	const resolveSessionId = options.resolveSessionId || defaultSessionIdResolver;

	return {
		route,
		method,
		async handle(input) {
			const request = input?.request || {};
			const userId = String(resolveUserId(request) || "guest").trim() || "guest";
			const sessionId =
				String(resolveSessionId(request, userId) || userId).trim() || userId;

			return method.handleRequest(
				{
					method: String(input?.method || "GET"),
					url: String(input?.url || "/"),
					body: input?.body,
					signal: input?.signal,
				},
				userId,
				sessionId,
			);
		},
	};
}

export function VanillaAdapter(options: VanillaWireAdapterOptions) {
	return createVanillaWireAdapter(options);
}
