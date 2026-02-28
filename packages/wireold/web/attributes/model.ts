import { registerWireHandler } from "../core/directives";

registerWireHandler("model", (el, { modifiers, expression }, { component, Alpine }) => {
    const property = expression;
    const isLive = modifiers.includes("live");
    const isBlur = modifiers.includes("blur");
    const isDefer = modifiers.includes("defer") || (!isLive && !isBlur);
    const debounceMs = modifiers.includes("debounce") ? parseInt(modifiers[modifiers.indexOf("debounce") + 1] || "150") : 150;

    let debounceTimer: any;

    if (el instanceof HTMLInputElement && el.type === "file") {
        const inputHandler = (e: any) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            const wrapped = files.map((file) => ({
                _is_upload_wrapper: true,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                uploading: { progress: 0, percent: 0, loaded: 0, total: file.size },
            }));
            const total = wrapped.reduce((acc, f) => acc + (f.size || 0), 0);
            const val = {
                _wire_type: "WireFile",
                files: wrapped,
                uploading: { progress: 0, percent: 0, loaded: 0, total },
            };
            component.state[property] = val;
            if (isDefer && typeof component.deferUpdate === "function") {
                component.deferUpdate(property, val);
            }
            if (isLive) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => component.callLive(property), debounceMs);
            }
        };

        el.addEventListener("change", inputHandler);
        if (isBlur) el.addEventListener("blur", () => component.callLive(property));
        return;
    }

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        const eventType = (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') ? 'change' : 'input';
        
        const inputHandler = (e: any) => {
            let val: any;
            if (e.target.type === "checkbox") {
                val = e.target.checked;
            } else {
                val = e.target.value;
            }
            component.state[property] = val;
            if (isDefer && typeof component.deferUpdate === "function") {
                component.deferUpdate(property, val);
            }
            
            if (isLive) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => component.callLive(property), debounceMs);
            }
        };

        el.addEventListener(eventType, inputHandler);
        if (isBlur) el.addEventListener('blur', () => component.callLive(property));

        // Reactive sync from state back to DOM
        Alpine.effect(() => {
            const val = component.state[property];
            if (el.type === 'checkbox') {
                (el as HTMLInputElement).checked = !!val;
            } else if (typeof val === "object" && val !== null) {
                // Defensive coercion: textual controls must never receive object values.
                el.value = "";
            } else if (el.value !== val) {
                el.value = val ?? '';
            }
        });
    }
});
