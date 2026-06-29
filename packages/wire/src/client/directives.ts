import type { ClientComponent } from "./component";
import type { WireRuntime } from "./runtime";
import { evaluate, type Wire } from "./wire";
import { effect } from "./reactivity";

export interface DirectiveContext {
	el: Element;
	/** Directive value after the colon (e.g. `model` in `wire:model`). */
	value: string;
	/** Modifiers after dots (e.g. `["live"]` in `wire:model.live`). */
	modifiers: string[];
	/** The attribute's expression (its value). */
	expression: string;
	component: ClientComponent;
	wire: Wire;
	runtime: WireRuntime;
	/** Register a teardown callback (run before re-binding). */
	cleanup(fn: () => void): void;
}

export type DirectiveHandler = (ctx: DirectiveContext) => void;

const DOM_EVENTS = new Set([
	"click",
	"submit",
	"change",
	"input",
	"keydown",
	"keyup",
	"blur",
	"focus",
]);

/** Holds directive handlers and applies them across a component's subtree. */
export class DirectiveRegistry {
	private readonly handlers = new Map<string, DirectiveHandler>();

	register(name: string, handler: DirectiveHandler): this {
		this.handlers.set(name, handler);
		return this;
	}

	apply(component: ClientComponent, wire: Wire, runtime: WireRuntime): void {
		const root = component.el;
		const elements = [root, ...Array.from(root.querySelectorAll("*"))];
		for (const el of elements) {
			// Don't reach into nested components — they bind themselves.
			if (el !== root && el.hasAttribute("wire:snapshot")) continue;
			const bound = boundSet(el);
			for (const attr of Array.from(el.attributes)) {
				if (!attr.name.startsWith("wire:")) continue;
				if (bound.has(attr.name)) continue;
				const [head, ...modifiers] = attr.name.slice(5).split(".");
				const value = head!;
				if (value === "id" || value === "snapshot" || value === "key") continue;

				const handler =
					this.handlers.get(value) ??
					(DOM_EVENTS.has(value) ? this.handlers.get("@event") : undefined);
				if (!handler) continue;

				bound.add(attr.name);
				const cleanups: Array<() => void> = [];
				handler({
					el,
					value,
					modifiers,
					expression: attr.value,
					component,
					wire,
					runtime,
					cleanup: (fn) => cleanups.push(fn),
				});
			}
		}
	}
}

const BOUND = new WeakMap<Element, Set<string>>();
function boundSet(el: Element): Set<string> {
	let set = BOUND.get(el);
	if (!set) BOUND.set(el, (set = new Set()));
	return set;
}

/** A registry preloaded with the core directives. */
export function createDefaultDirectives(): DirectiveRegistry {
	const reg = new DirectiveRegistry();

	// wire:click / wire:submit / wire:change / wire:keydown / ...
	reg.register("@event", ({ el, value, expression, wire }) => {
		el.addEventListener(value, (event) => {
			if (value === "submit") event.preventDefault();
			// `wire:click="increment"` (bare method) evaluates to a function — call it.
			// `wire:click="count++"` evaluates to a value and is already applied.
			const result = evaluate(expression, wire, event);
			if (typeof result === "function") (result as () => unknown)();
		});
	});

	// wire:model[.live|.blur|.lazy] — two-way binding.
	reg.register("model", ({ el, modifiers, expression, component }) => {
		const live = modifiers.includes("live");
		const input = el as HTMLInputElement;
		const path = expression.trim();
		const event = modifiers.includes("blur")
			? "blur"
			: modifiers.includes("lazy")
				? "change"
				: "input";

		const current = component.get(path);
		if (current !== undefined && input.value !== String(current)) input.value = String(current);

		input.addEventListener(event, () => {
			const value =
				input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
			component.set(path, value, live);
		});

		// Reflect server-driven changes back into the field.
		effect(() => {
			const next = component.get(path);
			if (next !== undefined && document.activeElement !== input && input.value !== String(next)) {
				input.value = String(next);
			}
		});
	});

	// wire:init — run an expression once.
	reg.register("init", ({ expression, wire }) => {
		evaluate(expression, wire);
	});

	// wire:poll[.2000ms] — periodic refresh.
	reg.register("poll", ({ modifiers, expression, wire, cleanup }) => {
		const ms = Number((modifiers.find((m) => m.endsWith("ms")) ?? "2000ms").replace("ms", "")) || 2000;
		const id = setInterval(() => {
			if (expression) evaluate(expression, wire);
			else void (wire as { $refresh(): unknown }).$refresh();
		}, ms);
		cleanup(() => clearInterval(id));
	});

	// wire:loading — show/hide while a request to this component is in flight.
	reg.register("loading", ({ el, component }) => {
		const htmlEl = el as HTMLElement;
		const initial = htmlEl.style.display;
		htmlEl.style.display = "none";
		const toggle = (e: Event) => {
			const detail = (e as CustomEvent).detail as { id: string; loading: boolean };
			if (detail.id !== component.id) return;
			htmlEl.style.display = detail.loading ? initial || "" : "none";
		};
		window.addEventListener("kirewire:loading", toggle);
	});

	return reg;
}
