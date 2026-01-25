import type { Component } from "../core/component";
import type { Directive } from "../core/directives";
import { parseAction } from "../core/parser";

export const wildcardHandler = (
	el: HTMLElement,
	dir: Directive,
	component: Component,
) => {
	// block reserved directives that are not events
	const reserved = [
		"model",
		"init",
		"loading",
		"poll",
		"ignore",
		"id",
		"data",
		"key",
		"target",
		"dirty",
		"snapshot",
		"effects",
	];
	if (reserved.includes(dir.type)) return;

	const eventName = dir.type;

	el.addEventListener(eventName, (e) => {
		if (dir.modifiers.includes("prevent")) e.preventDefault();
		if (dir.modifiers.includes("stop")) e.stopPropagation();
		if (dir.modifiers.includes("self") && e.target !== el) return;

		// wire:confirm support
		const confirmMsg = el.getAttribute("wire:confirm");
		if (confirmMsg) {
			if (!confirm(confirmMsg)) {
				return;
			}
		}

		const { method, params } = parseAction(dir.value);
		component.call(method, params);
	});
};
