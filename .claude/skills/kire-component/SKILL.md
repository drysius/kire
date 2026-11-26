---
name: kire-component
description: Create a Kirewire reactive component (a LiveComponent) for server-driven interactive UI — counters, forms, lists with wire:click/wire:model. Use when the user asks to add a wire/Kirewire/reactive/live component.
---

# Create a Kirewire component

A component is a class whose public properties are reactive state and whose
public methods are actions callable from the browser. See `packages/wire/AGENT.md`
and the tests in `packages/wire/tests/` for working examples.

## Steps

1. Create a class extending `LiveComponent` (from `@kirejs/wire`).
2. Register its name:
   - **TypeScript:** decorate with `@Component("name")`; mark reactive, client-writable
     props with `@prop`.
   - **JavaScript (no decorators):** `ownMeta(MyComponent).name = "name"` after the class.
3. Public properties = reactive state. Public methods = actions (invoked from the
   browser via `wire:click="method"`, `wire:submit`, …). `$`/`_`-prefixed members are
   internal and never serialized.
4. Implement `render()` — return an HTML string, or `this.view("viewName", data)` to
   render a `.kire` view with the component as scope.
5. Register the component with the server: `wire.component(MyComponent)`.
6. Mount it in a view with `@wire("name")`, and inject the client runtime once per
   page with `@kirewireScripts`. Two-way binding: `wire:model="prop"`.

## Example (TypeScript)

```ts
import { Component, LiveComponent, prop } from "@kirejs/wire";

@Component("counter")
export class Counter extends LiveComponent {
	@prop count = 0;
	increment() { this.count++; }
	render() { return `<button wire:click="increment">${this.count}</button>`; }
}
```

## Verify

Add a test under `packages/wire/tests/` (the JSDOM harness in `client-directives.test.ts`
is a good model) and run `bun test packages/wire/tests`.
