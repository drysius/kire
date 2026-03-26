type Envelope = {
	event: string;
	payload: any;
};

type PendingRequest = {
	callback: (response: any) => void;
	timer: ReturnType<typeof setTimeout>;
};

type FiveMBridgeConfig = {
	callEvent?: string;
	pushEvent?: string;
	nuiCallback?: string;
	requestTimeoutMs?: number;
};

declare global {
	// FiveM runtime globals (JS client runtime + NUI bridge).
	// eslint-disable-next-line no-var
	var emitNet: ((eventName: string, payload: any) => void) | undefined;
	// eslint-disable-next-line no-var
	var TriggerServerEvent:
		| ((eventName: string, payload: any) => void)
		| undefined;
	// eslint-disable-next-line no-var
	var onNet:
		| ((eventName: string, handler: (...args: any[]) => void) => void)
		| undefined;
	// eslint-disable-next-line no-var
	var RegisterNuiCallbackType: ((name: string) => void) | undefined;
	// eslint-disable-next-line no-var
	var SendNUIMessage: ((payload: any) => void) | undefined;
	// eslint-disable-next-line no-var
	var SendNuiMessage: ((payload: string) => void) | undefined;
	// eslint-disable-next-line no-var
	var on:
		| ((eventName: string, handler: (...args: any[]) => void) => void)
		| undefined;
	// eslint-disable-next-line no-var
	var __KIREWIRE_FIVEM_CONFIG__: FiveMBridgeConfig | undefined;
}

const runtimeConfig = (globalThis as any).__KIREWIRE_FIVEM_CONFIG__ as
	| FiveMBridgeConfig
	| undefined;

const config = {
	callEvent: String(runtimeConfig?.callEvent || "kirewire:call"),
	pushEvent: String(runtimeConfig?.pushEvent || "kirewire:push"),
	nuiCallback: String(runtimeConfig?.nuiCallback || "kirewire_call"),
	requestTimeoutMs: Math.max(
		1_000,
		Number(runtimeConfig?.requestTimeoutMs || 15_000),
	),
};

const pendingByRequest = new Map<string, PendingRequest>();
let requestSeq = 0;

function createRequestId() {
	requestSeq += 1;
	return `${Date.now()}-${requestSeq}`;
}

function emitServer(envelope: Envelope) {
	const sender =
		(globalThis as any).emitNet || (globalThis as any).TriggerServerEvent;
	if (typeof sender !== "function") {
		throw new Error(
			"[Kirewire][FiveM] emitNet/TriggerServerEvent is not available.",
		);
	}
	sender(config.callEvent, envelope);
}

function postToNui(event: string, payload: any) {
	const packet = {
		__kirewire: true,
		event,
		payload,
	};

	const sendNuiMessageObject = (globalThis as any).SendNUIMessage;
	if (typeof sendNuiMessageObject === "function") {
		try {
			sendNuiMessageObject(packet);
			return;
		} catch {
			// Fall back to JSON-string sender below.
		}
	}

	const sendNuiMessageString = (globalThis as any).SendNuiMessage;
	if (typeof sendNuiMessageString !== "function") return;

	try {
		sendNuiMessageString(JSON.stringify(packet));
	} catch {
		// Never throw across FiveM boundaries.
	}
}

function settleRequest(payload: any): boolean {
	const requestId = String(payload?.requestId || "");
	if (!requestId) return false;

	const pending = pendingByRequest.get(requestId);
	if (!pending) return false;

	pendingByRequest.delete(requestId);
	clearTimeout(pending.timer);
	pending.callback(payload);
	return true;
}

function handleServerPacket(rawPacket: any) {
	const event = String(rawPacket?.event || "").trim();
	const payload = rawPacket?.payload;
	if (!event) return;

	if (event === "response") {
		const handled = settleRequest(payload);
		if (!handled) postToNui("response", payload);
		return;
	}

	if (event === "update") {
		postToNui("update", payload);
		return;
	}

	postToNui(event, payload);
}

function normalizeEnvelope(input: any): Envelope {
	if (input && typeof input === "object" && typeof input.event === "string") {
		return {
			event: String(input.event),
			payload: input.payload,
		};
	}

	return {
		event: "call",
		payload: input,
	};
}

function registerNuiBridge() {
	const registerNuiCallbackType = (globalThis as any).RegisterNuiCallbackType;
	const onEvent = (globalThis as any).on;
	if (
		typeof registerNuiCallbackType !== "function" ||
		typeof onEvent !== "function"
	)
		return;

	registerNuiCallbackType(config.nuiCallback);
	onEvent(
		`__cfx_nui:${config.nuiCallback}`,
		(input: any, cb: (response: any) => void) => {
			const envelope = normalizeEnvelope(input);
			const payload =
				envelope.payload && typeof envelope.payload === "object"
					? envelope.payload
					: {};
			const requestId = String(payload.requestId || createRequestId());
			envelope.payload = {
				...payload,
				requestId,
			};

			const timer = setTimeout(() => {
				const pending = pendingByRequest.get(requestId);
				if (!pending) return;
				pendingByRequest.delete(requestId);
				cb({
					requestId,
					error: `FiveM bridge timeout after ${config.requestTimeoutMs}ms.`,
				});
			}, config.requestTimeoutMs);

			pendingByRequest.set(requestId, {
				timer,
				callback: (responsePayload: any) => {
					cb(responsePayload);
				},
			});

			try {
				emitServer(envelope);
			} catch (error: any) {
				clearTimeout(timer);
				pendingByRequest.delete(requestId);
				cb({
					requestId,
					error: String(error?.message || "Failed to emit FiveM wire message."),
				});
			}
		},
	);
}

function registerServerListener() {
	const onNetEvent = (globalThis as any).onNet;
	if (typeof onNetEvent !== "function") return;

	onNetEvent(config.pushEvent, (packet: any) => {
		try {
			handleServerPacket(packet);
		} catch (error) {
			// Never throw across FiveM event boundary.
			console.error("[Kirewire][FiveM] Failed to handle server packet:", error);
		}
	});
}

registerNuiBridge();
registerServerListener();

export {};
