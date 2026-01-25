import { generateEntangleFunction } from "../features/entangle";
import type { Component } from "./component";
import { findComponentByEl } from "./store";

export function createWireProxy(component: Component, Alpine: any): any {
	return new Proxy(
		{},
		{
			get(target, prop: string) {
				if (prop === "__instance") return component;

				// Magics
				if (prop === "$el") return component.el;
				if (prop === "$id") return component.id;
				if (prop === "$parent") {
					const parent = findComponentByEl(
						component.el.parentElement as HTMLElement,
					);
					return parent ? createWireProxy(parent, Alpine) : null;
				}
				if (prop === "$refs") {
					const refs: Record<string, Element> = {};
					component.el.querySelectorAll("[wire\\:ref]").forEach((refEl) => {
						const name = refEl.getAttribute("wire:ref");
						if (name) refs[name] = refEl;
					});
					return refs;
				}

				if (prop === "$refresh") return () => component.call("$refresh");
				if (prop === "$set")
					return (property: string, value: any) =>
						component.update({ [property]: value });
				if (prop === "$dispatch")
					return (event: string, params: any) =>
						window.dispatchEvent(new CustomEvent(event, { detail: params }));

				// Entangle
				if (prop === "$entangle" || prop === "entangle") {
					return generateEntangleFunction(component, Alpine);
				}

				// State Access
				if (prop in component.data) {
					return component.data[prop];
				}

				// Method Call Fallback
				return (...params: any[]) => {
					return component.call(prop, params);
				};
			},

			set(target, prop: string, value: any) {
				component.update({ [prop]: value });
				return true;
			},
		},
	);
}

export function registerMagic(Alpine: any) {
	Alpine.magic("wire", (el: HTMLElement) => {
		const component = findComponentByEl(el);

		if (!component) {
			console.warn("Kirewire: No component found for $wire", el);
			return undefined;
		}

		return createWireProxy(component, Alpine);
	});
}
