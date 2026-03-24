// @bun
// packages/wire/fivem/client.ts
var runtimeConfig = globalThis.__KIREWIRE_FIVEM_CONFIG__;
var config = {
  callEvent: String(runtimeConfig?.callEvent || "kirewire:call"),
  pushEvent: String(runtimeConfig?.pushEvent || "kirewire:push"),
  nuiCallback: String(runtimeConfig?.nuiCallback || "kirewire_call"),
  requestTimeoutMs: Math.max(1000, Number(runtimeConfig?.requestTimeoutMs || 15000))
};
var pendingByRequest = new Map;
var requestSeq = 0;
function createRequestId() {
  requestSeq += 1;
  return `${Date.now()}-${requestSeq}`;
}
function emitServer(envelope) {
  const sender = globalThis.emitNet || globalThis.TriggerServerEvent;
  if (typeof sender !== "function") {
    throw new Error("[Kirewire][FiveM] emitNet/TriggerServerEvent is not available.");
  }
  sender(config.callEvent, envelope);
}
function postToNui(event, payload) {
  const packet = {
    __kirewire: true,
    event,
    payload
  };
  const sendNuiMessageObject = globalThis.SendNUIMessage;
  if (typeof sendNuiMessageObject === "function") {
    try {
      sendNuiMessageObject(packet);
      return;
    } catch {}
  }
  const sendNuiMessageString = globalThis.SendNuiMessage;
  if (typeof sendNuiMessageString !== "function")
    return;
  try {
    sendNuiMessageString(JSON.stringify(packet));
  } catch {}
}
function settleRequest(payload) {
  const requestId = String(payload?.requestId || "");
  if (!requestId)
    return false;
  const pending = pendingByRequest.get(requestId);
  if (!pending)
    return false;
  pendingByRequest.delete(requestId);
  clearTimeout(pending.timer);
  pending.callback(payload);
  return true;
}
function handleServerPacket(rawPacket) {
  const event = String(rawPacket?.event || "").trim();
  const payload = rawPacket?.payload;
  if (!event)
    return;
  if (event === "response") {
    const handled = settleRequest(payload);
    if (!handled)
      postToNui("response", payload);
    return;
  }
  if (event === "update") {
    postToNui("update", payload);
    return;
  }
  postToNui(event, payload);
}
function normalizeEnvelope(input) {
  if (input && typeof input === "object" && typeof input.event === "string") {
    return {
      event: String(input.event),
      payload: input.payload
    };
  }
  return {
    event: "call",
    payload: input
  };
}
function registerNuiBridge() {
  const registerNuiCallbackType = globalThis.RegisterNuiCallbackType;
  const onEvent = globalThis.on;
  if (typeof registerNuiCallbackType !== "function" || typeof onEvent !== "function")
    return;
  registerNuiCallbackType(config.nuiCallback);
  onEvent(`__cfx_nui:${config.nuiCallback}`, (input, cb) => {
    const envelope = normalizeEnvelope(input);
    const payload = envelope.payload && typeof envelope.payload === "object" ? envelope.payload : {};
    const requestId = String(payload.requestId || createRequestId());
    envelope.payload = {
      ...payload,
      requestId
    };
    const timer = setTimeout(() => {
      const pending = pendingByRequest.get(requestId);
      if (!pending)
        return;
      pendingByRequest.delete(requestId);
      cb({
        requestId,
        error: `FiveM bridge timeout after ${config.requestTimeoutMs}ms.`
      });
    }, config.requestTimeoutMs);
    pendingByRequest.set(requestId, {
      timer,
      callback: (responsePayload) => {
        cb(responsePayload);
      }
    });
    try {
      emitServer(envelope);
    } catch (error) {
      clearTimeout(timer);
      pendingByRequest.delete(requestId);
      cb({
        requestId,
        error: String(error?.message || "Failed to emit FiveM wire message.")
      });
    }
  });
}
function registerServerListener() {
  const onNetEvent = globalThis.onNet;
  if (typeof onNetEvent !== "function")
    return;
  onNetEvent(config.pushEvent, (packet) => {
    try {
      handleServerPacket(packet);
    } catch (error) {
      console.error("[Kirewire][FiveM] Failed to handle server packet:", error);
    }
  });
}
registerNuiBridge();
registerServerListener();
