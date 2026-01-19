import Alpine from "alpinejs";
import morph from "@alpinejs/morph";
import { start } from "./lifecycle";

declare global {
    interface Window {
        Alpine: any;
        __KIREWIRE_CONFIG__: any;
    }
}

window.Alpine = Alpine;

Alpine.plugin(morph);

document.addEventListener('DOMContentLoaded', () => {
    start();
    Alpine.start();
});