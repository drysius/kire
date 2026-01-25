import { parseAction } from "../core/parser";
import { directive } from "../core/registry";

const handler = (el: HTMLElement, dir: any, component: any) => {
	const event = el.tagName === "FORM" ? "submit" : "click";
	el.addEventListener(event, (e) => {
		if (dir.modifiers.includes("prevent") || event === "submit")
			e.preventDefault();
		if (dir.modifiers.includes("stop")) e.stopPropagation();

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

directive("click", handler);
directive("submit", handler);
