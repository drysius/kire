import { Component } from './core/component';
import { addComponent, removeComponent, findComponentByEl, findComponent } from './core/store';
import { getDirectives } from './core/directives';
import { getDirectiveHandler } from './core/registry';
import { HttpAdapter, SocketAdapter, FivemAdapter } from '../adapters';

// Import directives to register them
import './directives/click';
import './directives/model';
import './directives/poll';
import './directives/loading';
import './directives/init';
import './directives/navigate';
import './directives/keydown';
import './directives/ignore';
import './directives/offline';
import './directives/intersect';

export default function WiredAlpinePlugin(Alpine: any) {
    const config = (window as any).__KIREWIRE_CONFIG__ || { endpoint: '/_wired', adapter: 'http' };
    
    // Polyfill for x-data="kirewire" safety
    Alpine.data('kirewire', () => ({}));

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

    const processNode = (node: Node) => {
        if (node.nodeType !== 1) return;
        const el = node as HTMLElement;
        
        // Prevent double processing
        if ((el as any).__wire_processed) return;

        // 1. Initialize Component if root
        let component = findComponentByEl(el);
        if (!component && el.hasAttribute('wire:id')) {
            const snapshot = el.getAttribute('wire:snapshot');
            if (snapshot) {
                component = new Component(el, snapshot, config, adapter);
                addComponent(component);
                (el as any).__livewire = component;
            }
        }

        // 2. Process Directives if inside component
        if (component) {
            const directives = getDirectives(el);
            if (directives.length > 0) {
                 directives.forEach(directive => {
                    handleDirective(el, directive, component!);
                });
                (el as any).__wire_processed = true;
            }
        }

        // 3. Recurse efficiently
        let child = el.firstElementChild;
        while (child) {
            processNode(child);
            child = child.nextElementSibling;
        }
    };

    const init = () => {
         processNode(document.body);

         new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => processNode(node));
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                             // Check the node itself
                             const el = node as HTMLElement;
                             if (el.hasAttribute('wire:id')) {
                                 const id = el.getAttribute('wire:id');
                                 if(id) {
                                     const comp = findComponent(id); // Import findComponent
                                     if (comp) {
                                         comp.cleanup();
                                         removeComponent(id);
                                     }
                                 }
                             }
                             // Check children (deep cleanup) - optional but recommended
                             // For now, let's just handle the root removal or assume flat structure for components
                        }
                    });
                }
            }
         }).observe(document.body, { childList: true, subtree: true });
    };

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
}

function handleDirective(el: HTMLElement, directive: any, component: Component) {
    const handler = getDirectiveHandler(directive.type);
    if (handler) {
        handler(el, directive, component);
    }
}