import { Kirewire } from "../kirewire";

function connectivityDirective(mode: "online" | "offline") {
    Kirewire.directive(mode, ({ el, expression, modifiers, cleanup }) => {
        const originalDisplay = el.style.display;
        const classMode = modifiers.includes("class");
        const attrMode = modifiers.includes("attr");
        const className = String(expression || modifiers[modifiers.indexOf("class") + 1] || `wire-${mode}`).trim();
        const attrName = String(expression || modifiers[modifiers.indexOf("attr") + 1] || "disabled").trim();

        const updateStatus = () => {
            const online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
            const active = mode === "online" ? online : !online;

            if (classMode) {
                if (active) el.classList.add(className);
                else el.classList.remove(className);
                return;
            }

            if (attrMode) {
                if (active) el.setAttribute(attrName, "true");
                else el.removeAttribute(attrName);
                return;
            }

            if (active) {
                if (originalDisplay) el.style.display = originalDisplay;
                else el.style.removeProperty("display");
                return;
            }
            el.style.display = "none";
        };

        window.addEventListener("online", updateStatus);
        window.addEventListener("offline", updateStatus);

        cleanup(() => {
            window.removeEventListener("online", updateStatus);
            window.removeEventListener("offline", updateStatus);
        });

        updateStatus();
    });
}

connectivityDirective("offline");
connectivityDirective("online");
