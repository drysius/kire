import { Kirewire } from "../kirewire";

Kirewire.directive('model', ({ el, expression, cleanup, wire }) => {
    if (el instanceof HTMLInputElement && el.type === 'file') return; // Handled by file-upload feature

    const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (!isInput) return;

    const componentId = el.closest('[wire-id]')?.getAttribute('wire-id');
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

        wire.$emit('component:call', {
            id: componentId,
            method: '$set',
            params: [expression, value]
        });
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
