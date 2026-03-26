function readAttr(el: Element, name: string): string {
	const value = el.getAttribute(name);
	return value === null ? "" : String(value).trim();
}

function hasAttrPrefix(el: Element, prefix: string): boolean {
	const attrs = el.getAttributeNames();
	for (let i = 0; i < attrs.length; i++) {
		if (attrs[i]!.startsWith(prefix)) return true;
	}
	return false;
}

export function resolveMorphKey(
	node: Element | null | undefined,
): string | null {
	if (!(node instanceof Element)) return null;

	const explicitKeys = [
		["wire:key", "wire-key"],
		["data-wire-key"],
		["data-kirewire-key"],
		["data-wire-collection-key"],
		["wire:id", "wire-id"],
		["id"],
	];

	for (let i = 0; i < explicitKeys.length; i++) {
		const aliases = explicitKeys[i]!;
		for (let j = 0; j < aliases.length; j++) {
			const name = aliases[j]!;
			const value = readAttr(node, name);
			if (value) return `${name}:${value}`;
		}
	}

	const href = readAttr(node, "href");
	if (href && hasAttrPrefix(node, "wire:navigate")) {
		return `wire:navigate:${href}`;
	}

	const wireClick = readAttr(node, "wire:click");
	if (wireClick) {
		const wireTarget = readAttr(node, "wire:target");
		return `wire:click:${wireClick}|target:${wireTarget}|tag:${node.tagName.toLowerCase()}`;
	}

	const wireModelAttrs = node
		.getAttributeNames()
		.filter((name) => name.startsWith("wire:model"));
	if (wireModelAttrs.length > 0) {
		const attrName = wireModelAttrs[0]!;
		const expr = readAttr(node, attrName);
		return `wire:model:${attrName}:${expr}|tag:${node.tagName.toLowerCase()}`;
	}

	return null;
}

export function morphDom(from: HTMLElement, to: HTMLElement) {
	const Alpine = (window as any).Alpine;
	if (!Alpine || typeof Alpine.morph !== "function") {
		from.replaceWith(to);
		return to;
	}

	Alpine.morph(from, to, {
		key: (el: Element) => resolveMorphKey(el),
		lookahead: true,
	});

	return from;
}
