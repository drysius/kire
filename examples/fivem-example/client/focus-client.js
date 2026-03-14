// FiveM NUI helper:
// - Starts hidden/unfocused.
// - Toggles open/close with a key.

let nuiOpen = false;

function postUiState(active) {
    const payload = {
        __kirewire_ui: true,
        visible: Boolean(active),
    };

    if (typeof SendNUIMessage === "function") {
        try {
            SendNUIMessage(payload);
            return;
        } catch {
            // Fall through to string variant.
        }
    }

    if (typeof SendNuiMessage === "function") {
        try {
            SendNuiMessage(JSON.stringify(payload));
        } catch {
            // Ignore post failures.
        }
    }
}

function setUiOpen(active) {
    const enabled = Boolean(active);

    if (typeof SetNuiFocus === "function") {
        SetNuiFocus(enabled, enabled);
    }

    if (typeof SetNuiFocusKeepInput === "function") {
        SetNuiFocusKeepInput(false);
    }

    if (enabled && typeof SetCursorLocation === "function") {
        SetCursorLocation(0.5, 0.5);
    }

    postUiState(enabled);
    nuiOpen = enabled;
}

const resourceName = typeof GetCurrentResourceName === "function"
    ? String(GetCurrentResourceName() || "")
    : "";

on("onClientResourceStart", (startedResource) => {
    if (resourceName && String(startedResource || "") !== resourceName) return;
    setUiOpen(false);
});

on("onClientResourceStop", (stoppedResource) => {
    if (resourceName && String(stoppedResource || "") !== resourceName) return;
    setUiOpen(false);
});

RegisterCommand("kirewire_open_ui", () => setUiOpen(true), false);
RegisterCommand("kirewire_close_ui", () => setUiOpen(false), false);
RegisterCommand("kirewire_toggle_ui", () => setUiOpen(!nuiOpen), false);

if (typeof RegisterKeyMapping === "function") {
    RegisterKeyMapping("kirewire_toggle_ui", "Toggle KireWire NUI", "keyboard", "M");
}
