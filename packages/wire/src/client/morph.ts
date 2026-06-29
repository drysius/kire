/**
 * Minimal DOM morphing: patch a live element to match new HTML while preserving
 * element identity (`wire:key` > `wire:id` > `id`), input focus/selection, and
 * subtrees marked `wire:ignore`. No external morph library.
 */

function keyOf(el: Element): string | null {
	return (
		el.getAttribute("wire:key") ??
		el.getAttribute("wire:id") ??
		(el.id ? `#${el.id}` : null)
	);
}

function isElement(n: Node): n is Element {
	return n.nodeType === 1;
}

/** Morph `from` in place to match the single-root `html` fragment. */
export function morph(from: Element, html: string): Element {
	const template = from.ownerDocument.createElement("template");
	template.innerHTML = html.trim();
	const to = template.content.firstElementChild;
	if (!to) return from;
	patchElement(from, to);
	return from;
}

function patchElement(from: Element, to: Element): void {
	if (from.tagName !== to.tagName) {
		from.replaceWith(to.cloneNode(true));
		return;
	}
	if (from.hasAttribute("wire:ignore")) return;

	patchAttributes(from, to);
	patchChildren(from, to);
}

/** Client-managed root attributes the server re-render omits; never strip them. */
const WIRE_MANAGED = new Set(["wire:id", "wire:name", "wire:snapshot"]);

function patchAttributes(from: Element, to: Element): void {
	for (const attr of Array.from(to.attributes)) {
		if (from.getAttribute(attr.name) !== attr.value)
			from.setAttribute(attr.name, attr.value);
	}
	for (const attr of Array.from(from.attributes)) {
		if (!to.hasAttribute(attr.name) && !WIRE_MANAGED.has(attr.name)) {
			from.removeAttribute(attr.name);
		}
	}

	// Keep the value of a focused input rather than clobbering what the user typed.
	const active = from.ownerDocument.activeElement;
	if (
		from === active &&
		(from instanceof HTMLInputElement || from instanceof HTMLTextAreaElement)
	) {
		return;
	}
	if (to instanceof HTMLInputElement && from instanceof HTMLInputElement) {
		if (from.value !== to.value) from.value = to.value;
	}
}

function patchChildren(from: Element, to: Element): void {
	const toChildren = Array.from(to.childNodes);
	const keyedFrom = new Map<string, Element>();
	for (const child of Array.from(from.childNodes)) {
		if (isElement(child)) {
			const k = keyOf(child);
			if (k) keyedFrom.set(k, child);
		}
	}

	let cursor: Node | null = from.firstChild;
	for (const next of toChildren) {
		if (isElement(next)) {
			const key = keyOf(next);
			const existing = key ? keyedFrom.get(key) : null;
			if (existing) {
				if (existing !== cursor) from.insertBefore(existing, cursor);
				patchElement(existing, next);
				cursor = existing.nextSibling;
				continue;
			}
			if (
				cursor &&
				isElement(cursor) &&
				cursor.tagName === next.tagName &&
				!keyOf(next)
			) {
				patchElement(cursor, next);
				cursor = cursor.nextSibling;
				continue;
			}
			from.insertBefore(next.cloneNode(true), cursor);
			continue;
		}
		// text / comment node
		if (cursor && cursor.nodeType === next.nodeType) {
			if (cursor.textContent !== next.textContent)
				cursor.textContent = next.textContent;
			cursor = cursor.nextSibling;
		} else {
			from.insertBefore(next.cloneNode(true), cursor);
		}
	}

	// Drop leftover live children the new tree no longer has.
	while (cursor) {
		const nextCursor = cursor.nextSibling;
		from.removeChild(cursor);
		cursor = nextCursor;
	}
}
