import Alpine from 'alpinejs';
import { Component } from './core/component';
import { addComponent, removeComponent, findComponentByEl } from './core/store';
import { getDirectives } from './core/directives';
import { getDirectiveHandler } from './core/registry';
import { HttpAdapter, SocketAdapter, FivemAdapter } from '../adapters';

// Import directives to register them
import './directives/click';
import './directives/model';
import './directives/poll';
import './directives/loading';

export function start() {
    const config = (window as any).__KIREWIRE_CONFIG__ || { endpoint: '/_wired', adapter: 'http' };
    console.log(config)
    let adapter: any;
    switch (config.adapter) {
        case 'socket':
            adapter = new SocketAdapter(config.endpoint);
            break;
        case 'fivem':
            adapter = new FivemAdapter();
            break;
        default:
            adapter = new HttpAdapter(config.endpoint, config.csrf);
            break;
    }

    Alpine.interceptInit(el => {
        // Skip if not inside a component and not a component itself
        if (!el.hasAttribute('wire:id') && !el.closest('[wire\\:id]')) return;

        // 1. Initialize Component
        if (el.hasAttribute('wire:id')) {
            const snapshot = el.getAttribute('wire:snapshot');
            if (snapshot) {
                const component = new Component(el, snapshot, config, adapter);
                addComponent(component);
                (el as any).__livewire = component;

                Alpine.onAttributeRemoved(el, 'wire:id', () => {
                    removeComponent(component.id);
                });
            }
        }

        // 2. Process Directives
        const component = findComponentByEl(el);
        if (!component) return;

        const directives = getDirectives(el);
        directives.forEach(directive => {
            handleDirective(el, directive, component);
        });
    });
}


function handleDirective(el: HTMLElement, directive: any, component: Component) {
    if ((el as any).__wire_processed) return;
    (el as any).__wire_processed = true;

    const handler = getDirectiveHandler(directive.type);
    if (handler) {
        handler(el, directive, component);
    }
}