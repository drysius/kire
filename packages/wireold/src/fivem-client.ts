/// <reference types="@citizenfx/client" />

const resourceName = GetCurrentResourceName();

const reqEvent = `${resourceName}:kirewire:request`;
const resEvent = `${resourceName}:kirewire:response`;
const uiResType = `${resourceName}:kirewire:response`;

// NUI -> Client
RegisterNuiCallbackType("kirewire-request");

on(
	"__cfx_nui:kirewire-request",
	(data: { requestId: string; payload: any }, cb: Function) => {
		const { requestId, payload } = data || {};
		cb({ ok: true }); // Acknowledge NUI fetch immediately

		// Client -> Server (namespaced)
		TriggerServerEvent(reqEvent, requestId, payload);
	},
);

// Server -> Client -> NUI
onNet(resEvent, (requestId: string, response: object) => {
	SendNUIMessage({
		type: uiResType,
		requestId,
		response,
	});
});

// Optional: Push events from server to NUI
const evtEvent = `${resourceName}:kirewire:event`;
const uiEvtType = `${resourceName}:kirewire:event`;

onNet(evtEvent, (eventName: string, payload: any) => {
	SendNUIMessage({
		type: uiEvtType,
		event: eventName,
		payload,
	});
});
