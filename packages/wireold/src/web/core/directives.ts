export class Directive {
	public type: string;
	public modifiers: string[];
	public value: string;

	constructor(
		public el: HTMLElement,
		public name: string,
	) {
		// wire:click.prevent="save"
		const parts = name.replace("wire:", "").split(".");
		this.type = parts[0] as string;
		this.modifiers = parts.slice(1);
		this.value = el.getAttribute(name) || "";
	}
}

export function isWireDirective(name: string) {
	return name.startsWith("wire:");
}

export function getDirectives(el: HTMLElement) {
	return el
		.getAttributeNames()
		.filter(isWireDirective)
		.map((name) => new Directive(el, name));
}
