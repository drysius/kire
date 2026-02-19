let els: Record<string, Element> = {};

export function storePersistantElementsForLater(
	callback: (el: Element) => void,
) {
	els = {};
	document.querySelectorAll("[x-persist]").forEach((i) => {
		const key = i.getAttribute("x-persist");
		if (key) els[key] = i;
		callback(i);
		(window as any).Alpine.mutateDom(() => {
			i.remove();
		});
	});
}

export function putPersistantElementsBack(
	callback: (old: Element, newEl: Element) => void,
) {
	const usedPersists: string[] = [];

	document.querySelectorAll("[x-persist]").forEach((i) => {
		const key = i.getAttribute("x-persist");
		if (!key) return;

		const old = els[key];
		if (!old) return;

		usedPersists.push(key);

		(old as any)._x_wasPersisted = true;

		callback(old, i);

		(window as any).Alpine.mutateDom(() => {
			i.replaceWith(old);
		});
	});

	Object.entries(els).forEach(([key, el]) => {
		if (usedPersists.includes(key)) return;
		(window as any).Alpine.destroyTree(el);
	});

	els = {};
}

export function isPersistedElement(el: Element) {
	return el.nodeType === 1 && el.hasAttribute("x-persist");
}
