import { directive } from "../core/registry";

directive("loading-progress", (el, dir, component) => {
	// Hide by default
	if (!el.hasAttribute("style") || !el.style.display) {
		el.style.display = "none";
	}

	window.addEventListener("wire:loading", (e: any) => {
		if (e.detail.id !== component.id) return;

		// Check wire:target
		const targetAttr = el.getAttribute("wire:target");
		if (targetAttr && e.detail.target) {
			const targets = targetAttr.split(",").map((t) => t.trim());
			// If the event target is not in the list of targets for this element, ignore
			if (!targets.includes(e.detail.target)) return;
		}

		// Show/Hide container
		if (e.detail.loading) {
			el.style.display = "";
		} else {
			el.style.display = "none";
			updateProgress(el, 0);
		}
	});

	window.addEventListener("wire:upload-progress", (e: any) => {
		if (e.detail.id !== component.id) return;
		updateProgress(el, e.detail.progress);
	});
});

function updateProgress(el: HTMLElement, value: number) {
	if (el instanceof HTMLProgressElement) {
		el.value = value;
	} else {
		el.style.width = `${value}%`;
		if (el.dataset.showText) {
			el.textContent = `${value}%`;
		}
	}
}
