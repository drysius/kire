(() => {
    const state = {
        uiVisible: false,
        menuVisible: false,
    };

    const sendNui = (payload) => {
        const sendObject = globalThis.SendNUIMessage;
        if (typeof sendObject === "function") {
            try {
                sendObject(payload);
                return;
            } catch {}
        }

        const sendString = globalThis.SendNuiMessage;
        if (typeof sendString !== "function") return;
        try {
            sendString(JSON.stringify(payload));
        } catch {}
    };

    const applyUiVisibility = (visible) => {
        state.uiVisible = Boolean(visible);

        if (typeof globalThis.SetNuiFocus === "function") {
            try {
                globalThis.SetNuiFocus(state.uiVisible, state.uiVisible);
            } catch {}
        }

        if (typeof globalThis.SetNuiFocusKeepInput === "function") {
            try {
                globalThis.SetNuiFocusKeepInput(false);
            } catch {}
        }

        sendNui({
            __kirewire_ui: true,
            visible: state.uiVisible,
        });

        if (!state.uiVisible) {
            state.menuVisible = false;
            sendNui({
                __kirewire_menu: true,
                visible: false,
            });
        }
    };

    const applyMenuVisibility = (visible) => {
        if (!state.uiVisible) applyUiVisibility(true);
        state.menuVisible = Boolean(visible);
        sendNui({
            __kirewire_menu: true,
            visible: state.menuVisible,
        });
    };

    const toggleUi = () => {
        applyUiVisibility(!state.uiVisible);
    };

    const toggleMenu = () => {
        applyMenuVisibility(!state.menuVisible);
    };

    if (typeof globalThis.RegisterCommand === "function") {
        globalThis.RegisterCommand("kirewire_open_ui", () => applyUiVisibility(true), false);
        globalThis.RegisterCommand("kirewire_close_ui", () => applyUiVisibility(false), false);
        globalThis.RegisterCommand("kirewire_toggle_ui", () => toggleUi(), false);

        globalThis.RegisterCommand("kirewire_open_menu", () => applyMenuVisibility(true), false);
        globalThis.RegisterCommand("kirewire_close_menu", () => applyMenuVisibility(false), false);
        globalThis.RegisterCommand("kirewire_toggle_menu", () => toggleMenu(), false);
    }

    if (typeof globalThis.RegisterKeyMapping === "function") {
        globalThis.RegisterKeyMapping("kirewire_toggle_ui", "KireWire: Toggle UI", "keyboard", "M");
        globalThis.RegisterKeyMapping("kirewire_toggle_menu", "KireWire: Toggle Debug Menu", "keyboard", "H");
    }

    if (
        typeof globalThis.RegisterNuiCallbackType === "function" &&
        typeof globalThis.on === "function"
    ) {
        globalThis.RegisterNuiCallbackType("kirewire_close_ui");
        globalThis.on("__cfx_nui:kirewire_close_ui", (_data, cb) => {
            applyUiVisibility(false);
            if (typeof cb === "function") cb({ ok: true });
        });

        globalThis.RegisterNuiCallbackType("kirewire_toggle_menu");
        globalThis.on("__cfx_nui:kirewire_toggle_menu", (_data, cb) => {
            toggleMenu();
            if (typeof cb === "function") cb({ ok: true, visible: state.menuVisible });
        });
    }

    applyUiVisibility(false);
})();
