---
route: "/docs/wire/actions-and-state"
title: "Actions, $wire & Magic"
description: "Calling server actions from the browser, two-way wire:model binding, the $wire object, and the built-in magic actions $set, $toggle and $refresh."
tags: ["wire", "actions", "wire:model", "$wire", "$set", "magic"]
section: "Kirewire"
order: 4
---

# Actions, `$wire` & Magic

## Calling actions

Any public method on your component subclass is callable from the browser.
`wire:click="increment"` calls `increment()`; arguments are supported:

```html
<button wire:click="increment">+1</button>
<button wire:click="addTo('cart', 3)">Add 3</button>
<form wire:submit="save"> … </form>
```

On the server the action runs inside the request pipeline; the component
re-renders and the new HTML is morphed in. `async` actions are awaited.

## Two-way binding with `wire:model`

`wire:model` binds an input to a `@prop`. Modifiers control when the value syncs:

```html
<input wire:model="title" />            <!-- local until the next action -->
<input wire:model.live="title" />       <!-- sync to server on input -->
<input wire:model.blur="title" />       <!-- sync on blur -->
<input wire:model.lazy="title" />       <!-- sync on change -->
```

Nested paths bind to nested state, vivifying containers as needed:

```html
<input wire:model.live="form.address.city" />
```

## The `$wire` object

Inside directive expressions (`wire:click`, `wire:model`, …) you have `$wire`,
a proxy over the component:

| Member | Purpose |
|---|---|
| `$wire.<prop>` | Read a reactive property. |
| `$wire.<method>(...)` | Call a server action. |
| `$wire.$get(path)` | Read by dot-path. |
| `$wire.$set(path, value, live?)` | Write a property (optionally sync now). |
| `$wire.$call(method, ...args)` | Call an action, returns a promise. |
| `$wire.$refresh()` | Re-render without other changes. |
| `$wire.$watch(path, cb)` | Observe a property locally. |
| `$wire.$entangle(path, live?)` | Two-way accessor `{ get, set }` for local UI state. |
| `$wire.$dispatch(event, ...params)` | Emit an event. |
| `$wire.$upload(path, files)` | Upload files to a property. |
| `$wire.$id`, `$wire.$el` | Instance id and root element. |

Bare identifiers in directive expressions resolve against `$wire`, so
`wire:click="increment"` and `wire:click="$set('open', true)"` both work.

## Magic actions

These `$`-prefixed actions are built in — no method needed on the component:

```html
<button wire:click="$refresh">Reload</button>
<button wire:click="$set('open', true)">Open</button>
<button wire:click="$toggle('open')">Toggle</button>
```

- `$refresh` — re-render only.
- `$set(path, value)` — write a property server-side.
- `$toggle(path)` — flip a boolean property.

Because they are intercepted before normal action dispatch, the reserved `$`
prefix never blocks them.

## Request batching

The client buffers interactions for ~5ms and pools them into a single request —
multiple property updates and action calls on a component travel together, and
several components can share one network round-trip.
