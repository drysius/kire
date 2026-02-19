import { registerWireHandler } from "../core/directives";

registerWireHandler("model", (el, { modifiers, expression }, { component, Alpine }) => {
    const property = expression;
    const isLive = modifiers.includes("live");
    const isBlur = modifiers.includes("blur");
    const debounceMs = modifiers.includes("debounce") ? parseInt(modifiers[modifiers.indexOf("debounce") + 1] || "150") : 150;

    let debounceTimer: any;

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        const eventType = (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') ? 'change' : 'input';
        
        const inputHandler = (e: any) => {
            const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            component.state[property] = val;
            
            if (isLive) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => component.call("$refresh"), debounceMs);
            }
        };

        el.addEventListener(eventType, inputHandler);
        if (isBlur) el.addEventListener('blur', () => component.call("$refresh"));

        // Reactive sync from state back to DOM
        Alpine.effect(() => {
            const val = component.state[property];
            if (el.type === 'checkbox') {
                (el as HTMLInputElement).checked = !!val;
            } else if (el.value !== val) {
                el.value = val ?? '';
            }
        });
    }
});
