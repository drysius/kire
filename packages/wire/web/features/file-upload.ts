import { wire } from "../kirewire";

wire.directive('model', ({ el, value, expression, cleanup }) => {
    if (!(el instanceof HTMLInputElement) || el.type !== 'file') return;

    const handler = async () => {
        const file = el.files?.[0];
        if (!file) return;

        const componentId = el.closest('[wire-id]')?.getAttribute('wire-id');
        if (!componentId) return;

        // Upload process (simplified)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('componentId', componentId);
        formData.append('property', expression);

        const response = await fetch('/_wire/upload', {
            method: 'POST',
            body: formData
        });

        const fileData = await response.json();
        
        // Notify the component that a file property has changed
        wire.$emit('component:call', {
            id: componentId,
            method: '$set',
            params: [expression, { ...fileData, __is_wire_file: true }]
        });
    };

    el.addEventListener('change', handler);
    cleanup(() => el.removeEventListener('change', handler));
});
