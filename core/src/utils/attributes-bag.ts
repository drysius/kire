import { escapeHtml } from "./html";

/**
 * Compute a class string from Blade-style input: a string, an array of strings,
 * or an object whose keys are classes toggled by truthy values.
 */
export function classString(input: unknown): string {
	if (input == null || input === false) return "";
	if (typeof input === "string") return input.trim();
	if (Array.isArray(input)) {
		const out: string[] = [];
		for (const item of input) {
			const s = classString(item);
			if (s) out.push(s);
		}
		return out.join(" ");
	}
	if (typeof input === "object") {
		const out: string[] = [];
		for (const key of Object.keys(input as Record<string, unknown>)) {
			if ((input as Record<string, unknown>)[key]) out.push(key);
		}
		return out.join(" ");
	}
	return String(input);
}

/**
 * Compute a style string from a string, array, or object of
 * `property: value` / `declaration: condition` pairs.
 */
export function styleString(input: unknown): string {
	if (input == null || input === false) return "";
	if (typeof input === "string") return input.trim().replace(/;?$/, ";");
	if (Array.isArray(input)) {
		return input
			.map((i) => styleString(i))
			.filter(Boolean)
			.join(" ");
	}
	if (typeof input === "object") {
		const out: string[] = [];
		for (const key of Object.keys(input as Record<string, unknown>)) {
			const v = (input as Record<string, unknown>)[key];
			if (v === false || v == null) continue;
			out.push(v === true ? `${key};` : `${key}: ${v};`);
		}
		return out.join(" ");
	}
	return String(input);
}

/**
 * A Blade-compatible attribute bag. Holds the attributes passed to a component
 * that were not consumed as declared props, and renders to an HTML attribute
 * string. Implements `toHtml()` so `{{ $attributes }}` renders it unescaped.
 */
export class KireAttributes {
	private readonly store: Record<string, unknown>;

	constructor(attrs: Record<string, unknown> = {}) {
		this.store = { ...attrs };
	}

	/** Raw value of an attribute, or a fallback. */
	get(name: string, fallback?: unknown): unknown {
		const v = this.store[name];
		return v === undefined ? fallback : v;
	}

	/** Whether every given attribute is present. */
	has(...names: string[]): boolean {
		return names.every((n) => n in this.store);
	}

	/** Whether any given attribute is present. */
	hasAny(...names: string[]): boolean {
		return names.some((n) => n in this.store);
	}

	/** Whether an attribute is present and not empty. */
	filled(name: string): boolean {
		const v = this.store[name];
		return v !== undefined && v !== null && v !== "";
	}

	/** A new bag containing only the given attributes. */
	only(names: string[]): KireAttributes {
		const out: Record<string, unknown> = {};
		for (const n of names) if (n in this.store) out[n] = this.store[n];
		return new KireAttributes(out);
	}

	/** Remove the given attributes from this bag in place (used by @props). */
	forget(names: string[]): this {
		for (const n of names) delete this.store[n];
		return this;
	}

	/** A new bag without the given attributes. */
	except(names: string[]): KireAttributes {
		const skip = new Set(names);
		const out: Record<string, unknown> = {};
		for (const k of Object.keys(this.store)) {
			if (!skip.has(k)) out[k] = this.store[k];
		}
		return new KireAttributes(out);
	}

	/**
	 * Merge default attributes. `class` and `style` are concatenated with any
	 * incoming values; other defaults only apply when the attribute is absent.
	 */
	merge(defaults: Record<string, unknown> = {}): KireAttributes {
		const out: Record<string, unknown> = { ...this.store };
		for (const key of Object.keys(defaults)) {
			if (key === "class") {
				out.class = [classString(defaults.class), classString(out.class)]
					.filter(Boolean)
					.join(" ");
			} else if (key === "style") {
				out.style = [styleString(defaults.style), styleString(out.style)]
					.filter(Boolean)
					.join(" ");
			} else if (out[key] === undefined) {
				out[key] = defaults[key];
			}
		}
		return new KireAttributes(out);
	}

	/** Merge/compute the `class` attribute from Blade-style input. */
	class(classes: unknown): KireAttributes {
		const incoming = classString(classes);
		const existing = classString(this.store.class);
		return new KireAttributes({
			...this.store,
			class: [incoming, existing].filter(Boolean).join(" "),
		});
	}

	/** Merge/compute the `style` attribute from Blade-style input. */
	style(styles: unknown): KireAttributes {
		const incoming = styleString(styles);
		const existing = styleString(this.store.style);
		return new KireAttributes({
			...this.store,
			style: [incoming, existing].filter(Boolean).join(" "),
		});
	}

	/** Render as an HTML attribute string (leading space when non-empty). */
	toHtml(): string {
		let out = "";
		for (const key of Object.keys(this.store)) {
			const value = this.store[key];
			if (value === false || value === null || value === undefined) continue;
			if (value === true) {
				out += ` ${key}`;
			} else {
				out += ` ${key}="${escapeHtml(value)}"`;
			}
		}
		return out;
	}

	toString(): string {
		return this.toHtml();
	}
}

export function createAttributes(
	attrs: Record<string, unknown> = {},
): KireAttributes {
	return new KireAttributes(attrs);
}
