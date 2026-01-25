import { parseAction } from "../core/parser";
import { directive } from "../core/registry";

directive("intersect", (el, dir, component) => {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const { method, params } = parseAction(dir.value);
					component.call(method, params);

					if (dir.modifiers.includes("once")) {
						observer.disconnect();
					}
				}
			});
		},
		{
			rootMargin: "0px",
			threshold: 0.1,
		},
	);

	observer.observe(el);
});
