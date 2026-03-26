---
route: "/docs/kire/creating-plugins"
title: "Creating Plugins"
description: "Extend Kire with directives, elements, globals, and schema-driven metadata for robust ecosystem modules."
tags: ["plugins", "schema", "directives", "elements", "extensibility"]
section: "Kire Internals"
order: 2
---

# Creating Plugins

Plugins are how Kire grows. Packages such as `@kirejs/wire`, `@kirejs/iconify` and `@kirejs/tailwind` all extend the engine through the same plugin surface.

## Minimal plugin shape

```ts
import { kirePlugin } from "kire";

export const MyPlugin = kirePlugin({}, (kire, _opts) => {
  kire.directive({
    name: "hello",
    signature: ["name:string"],
    description: "Writes a greeting.",
    example: "@hello('world')",
    onCall(api) {
      const name = api.getArgument(0) || "'world'";
      api.write(`$kire_response += "Hello " + (${name});`);
    },
  });
});
```

## What a plugin can add

Plugins can register:

- directives with `kire.directive(...)`
- elements with `kire.element(...)`
- attribute declarations with `kire.attribute(...)`
- type declarations with `kire.type(...)`
- globals with `kire.$global(...)`
- engine setup hooks with `kire.onFork(...)`

## Directive definitions

A directive definition can describe runtime behavior and editor metadata at the same time.

```ts
kire.directive({
  name: "hello",
  signature: ["name:string"],
  children: false,
  description: "Writes a greeting.",
  example: "@hello('world')",
  onCall(api) {
    const name = api.getArgument(0) || "'world'";
    api.write(`$kire_response += "Hello " + (${name});`);
  },
});
```

Useful metadata fields:

- `signature`
- `children`
- `description`
- `example`
- `declares`
- `related`
- `exposes`

That same metadata is consumed by tooling like `vs-kire`.

## Element definitions

Elements work similarly:

```ts
kire.element({
  name: "my-box",
  description: "Render a boxed container.",
  example: "<my-box tone=\"info\">Hello</my-box>",
  attributes: [
    {
      name: "tone",
      type: "string",
      description: "Visual tone of the box.",
    },
  ],
  onCall(api) {
    api.append("<div class=\\"my-box\\">");
    api.renderChildren();
    api.append("</div>");
  },
});
```

If you want declaration-only metadata for editors, you can register an element without `onCall`.

## Attribute declarations

Use `kire.attribute(...)` when your plugin adds attribute-level syntax but not a new tag.

```ts
kire.attribute({
  name: "wire:navigate",
  type: "boolean",
  description: "Intercept anchor navigation through the client runtime.",
});
```

This is how packages document wildcard attributes like `wire:*`.

## Schema metadata

If you publish a package, define schema metadata as well:

```ts
kire.kireSchema({
  name: "@acme/kire-plugin",
  version: "0.1.0",
  description: "Adds custom directives for Acme apps.",
});
```

And for external schema loaders:

```ts
import { defineSchema } from "kire";

export default defineSchema({
  name: "@acme/kire-plugin",
  handle(kire) {
    // register docs or runtime helpers
  },
});
```

## Fork-aware setup

If your plugin stores request-sensitive globals or managers, wire them into both the root engine and future forks:

```ts
const setup = (instance) => {
  instance.$global("auth", createAuthApi());
};

setup(kire);
kire.onFork((fork) => setup(fork));
```

That is the pattern used by packages like `@kirejs/wire` and `@kirejs/utils`.

## Documentation quality matters

If you want the docs site and the VS Code extension to explain your package well, fill these fields consistently:

- `description`
- `example`
- `signature`
- `attributes`
- `declares`

Without them, the runtime still works, but the package becomes much harder to discover and use correctly.

## Testing strategy

Recommended coverage:

1. compile-time output tests for directives and elements
2. render integration tests for expected HTML
3. schema and tooling tests for docs, attributes and declarations

## Good plugin rules

- keep runtime output deterministic
- prefer explicit names over magical context
- document every public directive, element and attribute
- expose editor metadata together with runtime behavior
- use `children`, `declares` and `attributes` accurately so tooling can keep up

## Related pages

- [How Kire Works](/docs/kire/how-kire-works)
- [Directives Reference](/docs/kire/directives-reference)
- [Elements Reference](/docs/kire/elements-reference)
