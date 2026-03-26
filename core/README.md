# Kire Core

`core/` is the source of the published `kire` package. It contains the parser, compiler, runtime, native directives, native elements, and the type/schema primitives used by the rest of the monorepo.

## What Core Provides

- template parsing for interpolations, directives, elements, and embedded code
- JavaScript code generation with source-aware error handling
- runtime helpers for rendering, caching, file loading, and request isolation
- plugin APIs for directives, elements, attributes, globals, tools, and types
- built-in Kire syntax such as `@if`, `@for`, `@switch`, `@define`, `@component`, and `<kire:*>`

## Plugin Authoring

Kire core is intentionally generic. Features such as auth, markdown, vite, wire, or icon integrations are layered on top through plugins.

```ts
import { Kire, kirePlugin } from "kire";

export const MyPlugin = kirePlugin({}, (kire) => {
	kire.directive({
		name: "hello",
		description: "Append a greeting to the output.",
		example: "@hello()",
		onCall(api) {
			api.append("Hello from MyPlugin");
		},
	});

	kire.element({
		name: "my-box",
		description: "Wrap children in a div.",
		example: "<my-box>content</my-box>",
		onCall(api) {
			api.append("<div>");
			api.renderChildren();
			api.append("</div>");
		},
	});
});

const kire = new Kire();
kire.plugin(MyPlugin);
```

## Tooling Metadata

If you are authoring a plugin, add metadata to everything you register:

- `description`
- `example`
- `signature`
- `declares`
- `comment` and `tstype` for types

`KIRE IntelliSense` consumes that metadata to show hover docs, examples, completions, declared variables, and package ownership inside VS Code.

## Typical Extension Points

- `kire.directive(...)`
- `kire.element(...)`
- `kire.attribute(...)`
- `kire.type(...)`
- `kire.$global(...)`
- `kire.kireSchema(...)`
- `kire.onFork(...)`

## Running Tests

```sh
bun test core/tests
```

## Related Packages

- Root overview: [`../README.md`](../README.md)
- VS Code extension: [`../vs-kire/README.md`](../vs-kire/README.md)

## License

MIT
