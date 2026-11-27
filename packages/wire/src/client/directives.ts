import { getDeep } from "../runtime/properties";
import type { ClientComponent } from "./component";
import { extractData } from "./data";
import { effect } from "./reactivity";
import type { WireRuntime } from "./runtime";
import { evaluate, type Wire } from "./wire";

/**
 * Whether a component has uncommitted local changes. Compares the reactive
 * `ephemeral` state against the last server snapshot; reading the ephemeral
 * values inside an `effect` makes the check reactive. When `paths` is given,
 * only those properties are considered (used by `wire:target`).
 */
function isDirty(component: ClientComponent, paths: string[]): boolean {
	const canonical = extractData(component.snapshot.data) as Record<
		string,
		unknown
	>;
	const keys = paths.length
		? paths
		: Object.keys(component.ephemeral as object);
	for (const key of keys) {
		const current = getDeep(component.ephemeral, key);
		const base = getDeep(canonical, key);
		if (JSON.stringify(current) !== JSON.stringify(base)) return true;
	}
	return false;
}

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
			// wire:confirm on the same element gates the action behind a confirm().
			const confirmMsg = el.getAttribute("wire:confirm");
			if (
				confirmMsg &&
				typeof window !== "undefined" &&
				!window.confirm(confirmMsg)
			)
				return;
			// `wire:click="increment"` (bare method) evaluates to a function — call it.
			// `wire:click="count++"` evaluates to a value and is already applied.
			const result = evaluate(expression, wire, event);
			if (typeof result === "function") (result as () => unknown)();
		});
	});

	// wire:model[.live|.blur|.lazy] — two-way binding.
	reg.register("model", ({ el, modifiers, expression, component, wire }) => {
		const live = modifiers.includes("live");
		const input = el as HTMLInputElement;
		const path = expression.trim();

		// File inputs upload on change, then store the returned token(s).
		if (input.type === "file") {
			input.addEventListener("change", () => {
				if (input.files && input.files.length)
					void wire.$upload(path, input.files);
			});
			return;
		}
		const event = modifiers.includes("blur")
			? "blur"
			: modifiers.includes("lazy")
				? "change"
				: "input";

		const current = component.get(path);
		if (current !== undefined && input.value !== String(current))
			input.value = String(current);

		input.addEventListener(event, () => {
			const value =
				input.type === "checkbox"
					? input.checked
					: input.type === "number"
						? Number(input.value)
						: input.value;
			component.set(path, value, live);
		});

		// Reflect server-driven changes back into the field.
		effect(() => {
			const next = component.get(path);
			if (
				next !== undefined &&
				document.activeElement !== input &&
				input.value !== String(next)
			) {
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
		const ms =
			Number(
				(modifiers.find((m) => m.endsWith("ms")) ?? "2000ms").replace("ms", ""),
			) || 2000;
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
			const detail = (e as CustomEvent).detail as {
				id: string;
				loading: boolean;
			};
			if (detail.id !== component.id) return;
			htmlEl.style.display = detail.loading ? initial || "" : "none";
		};
		window.addEventListener("kirewire:loading", toggle);
	});

	// wire:dirty[.class][.remove] — reflect uncommitted local changes.
	// Default: show the element only while dirty. With `.class`, toggle the
	// classes named in the attribute value instead (`.remove` inverts them).
	// `wire:target="a, b"` scopes dirtiness to specific properties.
	reg.register("dirty", ({ el, modifiers, expression, component }) => {
		const htmlEl = el as HTMLElement;
		const paths = (el.getAttribute("wire:target") || "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const useClass = modifiers.includes("class");
		const invert = modifiers.includes("remove");
		const classNames = expression.trim().split(/\s+/).filter(Boolean);
		const initial = htmlEl.style.display;
		if (!useClass) htmlEl.style.display = "none";

		effect(() => {
			const dirty = isDirty(component, paths);
			if (useClass) {
				const on = invert ? !dirty : dirty;
				for (const c of classNames) htmlEl.classList.toggle(c, on);
			} else {
				htmlEl.style.display = dirty ? initial || "" : "none";
			}
		});
	});

	// wire:offline — show the element only while the browser is offline.
	reg.register("offline", ({ el, cleanup }) => {
		const htmlEl = el as HTMLElement;
		const initial = htmlEl.style.display;
		const sync = () => {
			const offline =
				typeof navigator !== "undefined" && navigator.onLine === false;
			htmlEl.style.display = offline ? initial || "" : "none";
		};
		sync();
		window.addEventListener("online", sync);
		window.addEventListener("offline", sync);
		cleanup(() => {
			window.removeEventListener("online", sync);
			window.removeEventListener("offline", sync);
		});
	});

	return reg;
}
