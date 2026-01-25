import { directive } from "../core/registry";

directive("ignore", (el, dir, component) => {
	// Logic handled in morph function usually.
	// We could mark it here if needed.
	el.setAttribute("wire:ignore", "true");
});
