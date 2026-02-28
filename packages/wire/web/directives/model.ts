import { Kirewire } from "../kirewire";

Kirewire.directive('model', ({ el, expression, cleanup, wire }) => {
    if (el instanceof HTMLInputElement && el.type === 'file') return; // Handled by file-upload feature

    const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (!isInput) return;

    const meta = wire.getMetadata(el);
    if (!meta) return;
    const componentId = meta.id;

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

        wire.call(el, '$set', [expression, value]);
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
