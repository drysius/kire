import { FivemAdapter, SocketAdapter } from "../adapters";
import { Component } from "./core/component";
import { getDirectives } from "./core/directives";
import { getDirectiveHandler } from "./core/registry";
import {
	addComponent,
	findComponent,
	findComponentByEl,
	removeComponent,
} from "./core/store";

// Import directives to register them
import "./directives/click";
import "./directives/model";
import "./directives/poll";
import "./directives/loading";
import "./directives/init";
import "./directives/keydown";
import "./directives/ignore";
import "./directives/offline";
import "./directives/intersect";
import "./directives/loading-progress";
import "./directives/stream";
import "./directives/transition";
import "./directives/current";
import { registerMagic } from "./core/magic";
import { wildcardHandler } from "./directives/wildcard";

export default function WiredAlpinePlugin(Alpine: any) {
	const config = (window as any).__KIREWIRE_CONFIG__ || {
		endpoint: "/_wire",
		adapter: "http",
	};

	registerMagic(Alpine);
	Alpine.data("kirewire", () => ({}));

	Alpine.addRootSelector(() => "[wire\\:id]");

	Alpine.interceptInit(
		Alpine.skipDuringClone((el: HTMLElement) => {
			if (el.hasAttribute("wire:id")) {
				const id = el.getAttribute("wire:id")!;
				let component = findComponent(id);

				if (!component) {
					const snapshot = el.getAttribute("wire:snapshot");
					const isLazy = el.hasAttribute("wire:lazy");

					if (snapshot || isLazy) {
						try {
							component = new Component(el, snapshot, config);
							addComponent(component);
						} catch (e) {
							console.error("KireWire: Failed to initialize component", el, e);
						}
					}
				}

				if (component) {
					(el as any).__kirewire = component;
					if (el.hasAttribute("wire:lazy") && !el.getAttribute("wire:snapshot")) {
						component.loadLazy();
					}
				}
			}

			const component = findComponentByEl(el);
			if (component) {
				const directives = getDirectives(el);
				if (directives.length > 0) {
					directives.forEach((directive) => {
						handleDirective(el, directive, component!);
					});
				}
			}
		}),
	);

	// Cleanup observer
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList") {
				mutation.removedNodes.forEach((node) => {
					if (node.nodeType === 1) {
						const el = node as HTMLElement;
						if (el.hasAttribute("wire:id")) {
							const id = el.getAttribute("wire:id");
							if (id) {
								const comp = findComponent(id);
								if (comp) {
									comp.cleanup();
                                    comp.destroy();
									removeComponent(id);
								}
							}
						}
					}
				});
			}
		}
	});

	if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    else document.addEventListener("DOMContentLoaded", () => observer.observe(document.body, { childList: true, subtree: true }));
}

function handleDirective(
	el: HTMLElement,
	directive: any,
	component: Component,
) {
    if (directive.type === 'live' || directive.type === 'defer') {
        const mod = directive.type;
        directive.type = 'model';
        if (!directive.modifiers.includes(mod)) directive.modifiers.push(mod);
    }

	const handler = getDirectiveHandler(directive.type);
	if (handler) handler(el, directive, component);
	else wildcardHandler(el, directive, component);
}
