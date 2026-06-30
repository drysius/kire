import { ownMeta } from "./metadata";

/**
 * Standard (TC39) decorators that declare reactive metadata on a component class.
 * Field/method/getter decorators register their name through `addInitializer`
 * (runs per instance, idempotent) so no `Symbol.metadata` runtime is required.
 */

type AnyCtor = abstract new (...args: any[]) => object;

/** `@Component("name")` — register a component under a name. */
export function Component(name: string) {
	return (value: AnyCtor, _ctx: ClassDecoratorContext): void => {
		ownMeta(value as unknown as Function).name = name;
	};
}

/** `@prop` — declare a reactive, client-writable property. */
export function prop(
	_value: undefined,
	context: ClassFieldDecoratorContext,
): void {
	context.addInitializer(function (this: any) {
		ownMeta(this.constructor).props.add(String(context.name));
	});
}

/** `@locked` — a property the client may never write. */
export function locked(
	_value: undefined,
	context: ClassFieldDecoratorContext,
): void {
	context.addInitializer(function (this: any) {
		const meta = ownMeta(this.constructor);
		meta.props.add(String(context.name));
		meta.locked.add(String(context.name));
	});
}

/** `@computed` — expose a getter's value to the view (read-only). */
export function computed(
	_value: unknown,
	context: ClassGetterDecoratorContext,
): void {
	context.addInitializer(function (this: any) {
		ownMeta(this.constructor).computed.add(String(context.name));
	});
}

/** `@renderless` — a method that runs without triggering a re-render. */
export function renderless(
	_value: unknown,
	context: ClassMethodDecoratorContext,
): void {
	context.addInitializer(function (this: any) {
		ownMeta(this.constructor).renderless.add(String(context.name));
	});
}

/** `@on("event")` — call this method when the named event is dispatched. */
export function on(event: string) {
	return (_value: unknown, context: ClassMethodDecoratorContext): void => {
		context.addInitializer(function (this: any) {
			ownMeta(this.constructor).listeners.set(event, String(context.name));
		});
	};
}

/** `@validate(rule)` — attach a validation rule/schema to a property. */
export function validate(rule: unknown) {
	return (_value: undefined, context: ClassFieldDecoratorContext): void => {
		context.addInitializer(function (this: any) {
			const meta = ownMeta(this.constructor);
			meta.props.add(String(context.name));
			meta.rules.set(String(context.name), rule);
		});
	};
}

/** `@action` — explicitly allowlist a method as client-callable. */
export function action(
	_value: unknown,
	context: ClassMethodDecoratorContext,
): void {
	context.addInitializer(function (this: any) {
		ownMeta(this.constructor).actions.add(String(context.name));
	});
}

/** `@lazy` — defer the component's first render until it intersects the viewport. */
export function lazy(value: AnyCtor, _ctx: ClassDecoratorContext): void {
	ownMeta(value as unknown as Function).lazy = true;
}

/** `@url` — keep a property in sync with the page's URL query string. */
export function url(
	_value: undefined,
	context: ClassFieldDecoratorContext,
): void {
	context.addInitializer(function (this: any) {
		const meta = ownMeta(this.constructor);
		meta.props.add(String(context.name));
		meta.url.add(String(context.name));
	});
}
