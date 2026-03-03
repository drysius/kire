import { Kirewire } from "../kirewire";

Kirewire.directive('model', ({ el, expression, modifiers, cleanup, wire }) => {
    if (el instanceof HTMLInputElement && el.type === 'file') return;

    const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (!isInput) return;

    // Detect event type dynamically
    const getEventType = () => {
        if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) return 'change';
        if (el instanceof HTMLSelectElement) return 'change';
        return 'input';
    };

    const handler = (e: any) => {
        // IMPORTANT: Always get the FRESH component ID at the moment of input
        const componentId = wire.getComponentId(el);
        if (!componentId) return;

        let value: any;
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
            value = el.checked;
        } else {
            value = e.target.value;
        }

        if (modifiers.includes('defer')) {
            wire.defer(componentId, expression, value);
        } else {
            wire.call(el, '$set', [expression, value]);
        }
    };

    const eventType = getEventType();
    el.addEventListener(eventType, handler);
    cleanup(() => el.removeEventListener(eventType, handler));

    // Sync from server to DOM
    const unbind = wire.$on('component:update', (data) => {
        const currentId = wire.getComponentId(el);
        if (data.id === currentId && data.state[expression] !== undefined) {
            const newValue = data.state[expression];
            if (el instanceof HTMLInputElement && el.type === 'checkbox') {
                el.checked = !!newValue;
            } else {
                if ((el as any).value !== newValue) {
                    (el as any).value = newValue;
                }
            }
        }
    });
    cleanup(unbind);
});
