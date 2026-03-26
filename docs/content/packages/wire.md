---
route: "/docs/packages/wire"
title: "@kirejs/wire"
description: "Server-driven components for Kire with hydration, effects, streaming, navigation, and client directives."
tags: ["wire", "components", "hydrate", "stream", "navigate", "directives"]
section: "Packages"
order: 2
---

# @kirejs/wire

`@kirejs/wire` adds server-driven reactive components to Kire. It keeps rendering logic on the server while shipping a small client runtime for hydration, actions, navigation and DOM updates.

## What the package adds

- the `Component` base class
- the `KirewirePlugin`
- component mounting through `@wire(...)`
- element mounting through `<wire:* />`, `<kirewire:* />`, `<livewire:* />`
- a large set of `wire:*` attributes for actions, models, loading states and navigation
- HTTP, SSE, socket and framework adapters

## Minimal setup

```ts
import { Kire } from "kire";
import { wirePlugin, HttpAdapter } from "@kirejs/wire";

const kire = new Kire({ root: "./views" });

kire.plugin(new wirePlugin({
  secret: "change-me",
  adapter: new HttpAdapter({ route: "/_wire" }),
}));
```

In your layout, inject the client runtime:

```kire
<!doctype html>
<html>
  <body>
    @yield("content")
    @kirewire()
  </body>
</html>
```

## Component class

```ts
import { Component } from "@kirejs/wire";

export default class Counter extends Component {
  public count = 0;

  increment() {
    this.count += 1;
  }

  render() {
    return this.view("components.counter");
  }
}
```

```kire
<div>
  <button wire:click="increment">+</button>
  <span>{{ count }}</span>
</div>
```

## Mounting components

### `@wire(name, locals?)`

Directive-based mount.

```kire
@wire("chat", { roomId: room.id })
```

### `<wire:* />`

Element-based mount.

```kire
<wire:chat room-id="{{ room.id }}" />
```

### `<kirewire:* />` and `<livewire:* />`

Aliases of `wire:*`.

```kire
<kirewire:chat room-id="{{ room.id }}" />
<livewire:chat room-id="{{ room.id }}" />
```

Attribute names are normalized into locals, so `room-id` becomes `roomId`.

The three element forms accept the same prop styles:

```kire
<wire:chat room-id="{{ room.id }}" :limit="25" compact />
<kirewire:chat room-id="{{ room.id }}" />
<livewire:chat room-id="{{ room.id }}" />
```

In this example:

- `room-id` becomes `roomId`
- `:limit` is treated as a JavaScript expression
- `compact` becomes `compact: true`

Resolution order for a tag like `<wire:chat-room />` is:

1. `chat-room`
2. `kirewire.chat-room`
3. `livewire.chat-room`
4. `components.chat-room`

## Important directives

### `@kirewire()`

Injects the client runtime script, transport metadata and bootstrap configuration for the current page.

### `@wire:id(...)`

Low-level hydration helper used internally by the package.

## Important attributes

### `wire:click`

Call a component method on click.

```kire
<button wire:click="save">Save</button>
```

### `wire:model`

Two-way field synchronization.

```kire
<input wire:model="title" />
```

Useful modifiers:

- `.live`
- `.defer`
- `.lazy`
- `.blur`
- `.debounce.300ms`

### `wire:loading`

React while a component request is running.

```kire
<div wire:loading>Saving...</div>
<button wire:loading.attr="disabled">Save</button>
```

### `wire:target`

Limit another directive to one or more actions:

```kire
<div wire:loading wire:target="save,remove">Working...</div>
```

### `wire:poll`

Periodic refresh or action trigger.

```kire
<div wire:poll.5s="$refresh"></div>
```

### `wire:intersect`

Intersection observer action trigger.

```kire
<div wire:intersect.once="loadMore"></div>
```

### `wire:show`

Conditional visibility driven by component state.

```kire
<div wire:show="open">Panel</div>
```

### `wire:dirty`

Mark DOM while a bound model diverges from the last server snapshot.

```kire
<input wire:model="title">
<span wire:dirty.class="text-warning">Unsaved</span>
```

### `wire:ignore`

Exclude part of the DOM from morphing.

```kire
<div wire:ignore></div>
```

### `wire:navigate`

Intercept same-origin navigation and swap the page through the Wire client runtime.

```kire
<a href="/docs/kire/getting-started" wire:navigate>Docs</a>
```

### Generic `wire:*`

The package also declares a wildcard event form for custom events and modifiers:

```kire
<form wire:submit.prevent="save"></form>
<div wire:keydown.enter="search"></div>
```

Common modifiers:

- `.prevent`
- `.stop`
- `.self`
- `.once`
- `.window`
- `.document`
- `.debounce.300ms`
- `.throttle.300ms`

## Collection updates

Use `wire:collection` when you want targeted list patches instead of a full component remorph.

```kire
<ul wire:collection="messages"></ul>
<div wire:collection.empty="messages">No messages yet.</div>
```

From the component:

```ts
this.prependToCollection("messages", message, {
  key: "id",
  limit: 25,
});
this.$skipRender();
```

## Navigation and transport

Wire can work through different adapters and transports:

- plain HTTP
- HTTP + SSE
- sockets
- framework adapters like Elysia, Express and Koa

Choose the adapter that matches your app architecture and deployment model.

## When to use it

Use `@kirejs/wire` when:

- state should stay authoritative on the server
- you want minimal client-side application code
- your team prefers template-first or action-first development

## Related pages

- [kire (core)](/docs/packages/core)
- [Browser Runtime and Playground](/docs/kire/browser-playground)
- [Elements Reference](/docs/kire/elements-reference)
