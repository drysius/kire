export function toggleBooleanState(
	el: HTMLElement,
	directive: any,
	isTruthy: boolean,
	cachedDisplay: string | null = null,
) {
	const modifiers = directive.modifiers || [];
	// Handle .remove modifier logic (flip truthy)
	isTruthy = modifiers.includes("remove") ? !isTruthy : isTruthy;

	if (modifiers.includes("class")) {
		const classes = directive.value.split(" ").filter(Boolean);
		if (isTruthy) {
			el.classList.add(...classes);
		} else {
			el.classList.remove(...classes);
		}
	} else if (modifiers.includes("attr")) {
		if (isTruthy) {
			el.setAttribute(directive.value, "true");
		} else {
			el.removeAttribute(directive.value);
		}
	} else {
		// Display toggling
		let display = "inline-block";

		// Check for specific display modifiers
		["inline", "block", "table", "flex", "grid", "inline-flex"].forEach((d) => {
			if (modifiers.includes(d)) display = d;
		});

		// Use cached display or computed style if 'remove' modifier is present but condition is false
		// (restore original display)
		if (modifiers.includes("remove") && !isTruthy) {
			display = cachedDisplay || "";
		}

		el.style.display = isTruthy ? display : "none";
	}
}

export function extractDuration(
	modifiers: string[],
	defaultDuration = 2000,
): number {
	const msMod = modifiers.find((m) => m.endsWith("ms"));
	const sMod = modifiers.find((m) => m.endsWith("s") && !m.endsWith("ms")); // avoid double match

	if (msMod) return parseInt(msMod);
	if (sMod) return parseInt(sMod) * 1000;

	return defaultDuration;
}
