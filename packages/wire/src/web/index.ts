import Alpine from "alpinejs";
import morph from "@alpinejs/morph";
import WiredAlpinePlugin from "./lifecycle";

//@ts-expect-error ignore
window.Alpine = Alpine;

Alpine.plugin(morph);
Alpine.plugin(WiredAlpinePlugin);

document.addEventListener('DOMContentLoaded', () => {
    Alpine.start();
});