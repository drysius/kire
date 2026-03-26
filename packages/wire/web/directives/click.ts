import { Kirewire } from "../kirewire";

Kirewire.directive("click", ({ el, expression, cleanup, wire }) => {
	const handler = (e: MouseEvent) => {
		e.preventDefault();
		wire.call(el, expression);
	};
	el.addEventListener("click", handler);
	cleanup(() => el.removeEventListener("click", handler));
});
