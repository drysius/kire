import { Kirewire } from "../kirewire";

Kirewire.directive('ignore', ({ el, modifiers }) => {
    if (modifiers.includes('self')) {
        el.setAttribute('wire:ignore-self', 'true');
    } else {
        el.setAttribute('wire:ignore', 'true');
    }
});
