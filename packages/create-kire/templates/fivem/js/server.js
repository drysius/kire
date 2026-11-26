import { kireFivem } from "@kirejs/fivem";
import { Kirewire } from "@kirejs/wire";
import { Counter } from "./counter.js";

// FiveM natives (GetCurrentResourceName, GetResourcePath, RegisterNuiCallback,
// RegisterCommand, SendNuiMessage, SetNuiFocus) are provided by the runtime.

const resource = GetCurrentResourceName();
const views = `${GetResourcePath(resource)}/views`;

const wire = new Kirewire({ secret: process.env.APP_SECRET ?? "change-me" });
wire.component(Counter);

const fivem = kireFivem({ views, wire: { instance: wire } });

RegisterNuiCallback(fivem.path, fivem.handler);

RegisterCommand(
	"counter",
	async () => {
		SetNuiFocus(true, true);
		SendNuiMessage(JSON.stringify({ type: "page", html: await fivem.render("counter") }));
	},
	false,
);

RegisterNuiCallback("close", (_data, cb) => {
	SetNuiFocus(false, false);
	SendNuiMessage(JSON.stringify({ type: "close" }));
	cb({});
});
