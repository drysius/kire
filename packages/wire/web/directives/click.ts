import { wire } from "../kirewire";

wire.directive('click', ({ el, expression, cleanup }) => {
    const handler = (e: MouseEvent) => {
        e.preventDefault();
        const componentId = el.closest('[wire-id]')?.getAttribute('wire-id');
        if (componentId) {
            wire.$emit('component:call', { 
                id: componentId, 
                method: expression,
                params: [] 
            });
        }
    };
    el.addEventListener('click', handler);
    cleanup(() => el.removeEventListener('click', handler));
});
