---
route: "/docs/wire/components"
title: "Components & Lifecycle"
description: "The LiveComponent base class: reactive properties, callable actions, rendering with view(), and the full server lifecycle (mount, hydrate, update, render, dehydrate)."
tags: ["wire", "component", "lifecycle", "mount", "render"]
section: "Kirewire"
order: 2
---

# Components & Lifecycle

A Kirewire component is a class extending `LiveComponent`. Its **public
properties** are reactive state; its **public methods** are actions the browser
can invoke.

```ts
import { LiveComponent, Component, prop } from "@kirejs/wire";

@Component("counter")
export class Counter extends LiveComponent {
  @prop count = 0;
  @prop step = 1;

  increment() { this.count += this.step; }

  render() { return this.view("components.counter"); }
}
```

## Properties = state

Any own enumerable property that is not prefixed with `$` or `_` is part of the
serialized state and travels in the snapshot. Use `@prop` to mark a property as
reactive and client-writable (via `wire:model`). Framework-internal members are
prefixed (`$id`, `$name`, `$kire`, `$context`) and are never serialized.

```ts
@prop title = "";       // client may bind/update via wire:model
count = 0;              // public state, but not client-writable unless @prop'd
private _cache = {};    // never serialized, never callable
```

> Rich values (`Date`, `Map`, `Set`, `BigInt`, nested objects/arrays) are
> serialized through [synthesizers](/docs/wire/security#synthesizers) and
> reconstructed on the next request.

## Methods = actions

Public methods defined on your subclass are callable from the browser. Methods
on `LiveComponent` itself, reserved names (`render`, `view`, `mount`, …), and
`$`/`_`-prefixed methods are **not** callable.

```ts
async save() {
  await db.posts.insert({ title: this.title });
  this.$dispatch("saved");
}
```

Actions can be `async`; the response waits for them. Return values are sent back
to the caller (resolve the promise from `$wire.save()`).

## Rendering

`render()` returns the component's HTML. The common path is `view(path, extra?)`,
which renders a Kire template with the component as scope:

```ts
render() {
  return this.view("components.post-editor", { now: Date.now() });
}
```

The template receives every public property, every `@computed` value, and an
`$errors` bag, plus anything in `extra`. You can also return a plain string.

## Lifecycle

Define any of these methods; the runtime calls them at the right time:

| Method | When |
|---|---|
| `boot()` | Before every mount and every update, first thing. |
| `mount(params)` | Once, on initial SSR mount (receives mount params). |
| `booted()` | Right after `mount()`. |
| `hydrated()` | On every subsequent request, after state is restored. |
| `updating<Prop>(value, path)` | Before a `wire:model`/`$set` write lands. |
| `updated<Prop>(value, path)` | After the write lands. |
| `updating(path, value)` / `updated(path, value)` | Generic forms. |
| `rendering()` / `rendered(html)` | Around `render()`. |

```ts
@Component("profile")
export class Profile extends LiveComponent {
  @prop email = "";

  mount(p: { email: string }) { this.email = p.email; }

  updatingEmail(value: string) {
    // veto/normalize before it lands (throw to reject)
  }
  updatedEmail(value: string) {
    // react after it changed
  }
}
```

## The request pipeline

Every update runs the same sequence on the server:

```
verify checksum → hydrate state → apply property updates → call actions
                → render (unless renderless) → dehydrate → sign new snapshot
```

A tampered snapshot fails verification and the request is rejected with `419`.
See [Security](/docs/wire/security).
