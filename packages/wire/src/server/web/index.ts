import { KireWireClient } from "./client";

declare global {
	interface Window {
		KireWire: KireWireClient;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	// Config injected by server
	const config = (window as any).__KIREWIRE_CONFIG__ || {
		endpoint: "/_kirewire",
		method: "http",
	};
	window.KireWire = new KireWireClient(config.endpoint, config.method);
});
