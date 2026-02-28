import { Kirewire } from "../kirewire";

Kirewire.directive('model', ({ el, expression, modifiers, cleanup, wire }) => {
    if (el instanceof HTMLInputElement && el.type === 'file') return;

    const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (!isInput) return;

    const componentId = wire.getComponentId(el);
    if (!componentId) return;

    const eventType = (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) || el instanceof HTMLSelectElement 
        ? 'change' 
        : 'input';

    const handler = (e: any) => {
        let value: any;
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
            value = el.checked;
        } else {
            value = e.target.value;
        }

        if (modifiers.includes('defer')) {
            // Store locally in the deferred map
            wire.defer(componentId, expression, value);
        } else {
            // Call server immediately
            wire.call(el, '$set', [expression, value]);
        }
    };

    el.addEventListener(eventType, handler);
    cleanup(() => el.removeEventListener(eventType, handler));

    // Initial sync from component to DOM
    wire.$on('component:update', (data) => {
        if (data.id === componentId && data.state[expression] !== undefined) {
            const newValue = data.state[expression];
            if (el instanceof HTMLInputElement && el.type === 'checkbox') {
                el.checked = !!newValue;
            } else {
                (el as any).value = newValue;
            }
        }
    });
});
