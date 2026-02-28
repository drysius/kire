import { Kirewire } from "../kirewire";
import { bus } from "../utils/message-bus";

Kirewire.directive('click', ({ el, expression, cleanup, wire }) => {
    const handler = (e: MouseEvent) => {
        e.preventDefault();
        const componentId = el.closest('[wire-id]')?.getAttribute('wire-id');
        if (componentId) {
            const state = JSON.parse(el.closest('[wire-id]')?.getAttribute('wire:state') || '{}');
            const checksum = el.closest('[wire-id]')?.getAttribute('wire:checksum');

            // Use MessageBus for batching
            bus.enqueue({ 
                id: componentId, 
                method: expression,
                params: [],
                state,
                checksum,
                pageId: '' // Will be filled by adapter
            });
        }
    };
    el.addEventListener('click', handler);
    cleanup(() => el.removeEventListener('click', handler));
});
