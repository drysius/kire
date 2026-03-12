---
route: "/docs/kire/creating-plugins"
title: "Creating Plugins"
description: "Extend Kire with directives, elements, globals, and schema-driven metadata for robust ecosystem modules."
tags: ["plugins", "schema", "directives", "elements", "extensibility"]
section: "Kire Internals"
order: 2
---

# Creating Plugins

Kire plugins are the main extension mechanism for new language features and runtime helpers.

## Plugin Goals

A good plugin should be:

- small and focused
- explicit about directives/elements it adds
- safe under production cache
- easy to test in isolation

## Minimal Plugin Shape

```ts
import { defineSchema } from "kire";

export default defineSchema({
  name: "my-kire-plugin",
  description: "Adds custom directives",
  handle: (kire) => {
    kire.directive({
      name: "hello",
      params: ["name:string"],
      onCall(api) {
        const name = api.getArgument(0) || "'world'";
        api.write(`$kire_response += "Hello " + (${name});`);
      },
    });
  },
});
```

## Directive Design Tips

- Validate params early.
- Keep generated code minimal.
- Make async behavior explicit (`api.markAsync()` when required).
- Prefer deterministic output for easier caching and testing.

## Element Extensions

Custom elements can provide semantic shortcuts and editor tooling metadata.
When adding custom elements, document expected attributes and behavior clearly.

## Schema Metadata

Schema metadata helps tooling (for example VS extensions) with:

- completion
- hover descriptions
- argument typing hints

## Testing Strategy

1. unit test directive code generation
2. integration test rendered output
3. regression test invalid inputs and edge cases

## Versioning and Compatibility

When changing directive signatures, treat it as an API change.
Document migration notes and keep backwards compatibility when possible.
