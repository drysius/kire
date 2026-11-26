import { kireFivem } from "@kirejs/fivem";
import { Kirewire } from "@kirejs/wire";
import { Counter } from "./counter";

// FiveM natives (provided by the server runtime).
declare function GetCurrentResourceName(): string;
declare function GetResourcePath(resource: string): string;
declare function RegisterNuiCallback(
	name: string,
	cb: (data: unknown, cb: (response: unknown) => void) => void,
): void;
declare function RegisterCommand(name: string, handler: () => void, restricted: boolean): void;
declare function SendNuiMessage(json: string): void;
declare function SetNuiFocus(hasFocus: boolean, hasCursor: boolean): void;

const resource = GetCurrentResourceName();
const views = `${GetResourcePath(resource)}/views`;

const wire = new Kirewire({ secret: process.env.APP_SECRET ?? "change-me" });
wire.component(Counter);

const fivem = kireFivem({ views, wire: { instance: wire } });

// Handle wire:click / wire:model updates coming from the NUI.
RegisterNuiCallback(fivem.path, fivem.handler);

// `/counter` opens the UI and pushes the rendered page to the NUI.
RegisterCommand(
	"counter",
	async () => {
		SetNuiFocus(true, true);
		SendNuiMessage(JSON.stringify({ type: "page", html: await fivem.render("counter") }));
	},
	false,
);

// NUI asks to close itself (bind a key / button to post this callback).
RegisterNuiCallback("close", (_data, cb) => {
	SetNuiFocus(false, false);
	SendNuiMessage(JSON.stringify({ type: "close" }));
	cb({});
});
