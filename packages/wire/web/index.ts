import Alpine from "alpinejs";
import morph from "@alpinejs/morph";
import WireAlpinePlugin from "./lifecycle";

// Register handlers
import "./attributes/model";
import "./attributes/click";
import "./attributes/ignore";
import "./attributes/navigate";
import "./attributes/poll";
import "./attributes/loading";
import "./attributes/dirty";
import "./attributes/init";
import "./attributes/offline";

// Register Plugins
Alpine.plugin(morph);
Alpine.plugin(WireAlpinePlugin);

const Wire = {
    start: (config: { endpoint?: string } = {}) => {
        (window as any).__WIRE_CONFIG__ = { endpoint: config.endpoint || "/_wire" };
        Alpine.start();
    },
    emit: (name: string, ...params: any[]) => window.dispatchEvent(new CustomEvent(name, { detail: params }))
};

(window as any).Wire = Wire;
(window as any).Alpine = Alpine;

if (!(window as any).__WIRE_MANUAL_START__) {
    document.addEventListener("DOMContentLoaded", () => Wire.start());
}

export default Wire;
