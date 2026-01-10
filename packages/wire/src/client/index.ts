import { KireWireClient } from "./client";

// Auto-initialize if config is present
if (typeof window !== "undefined" && window.__KIREWIRE_CONFIG__) {
	window.KireWire = new KireWireClient(window.__KIREWIRE_CONFIG__);
}
