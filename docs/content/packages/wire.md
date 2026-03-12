---
route: "/docs/packages/wire"
title: "@kirejs/wire"
description: "Server-driven components for Kire with hydration, effects, streaming, navigation, and client directives."
tags: ["wire", "components", "hydrate", "stream", "navigate", "directives"]
section: "Packages"
order: 2
---

# @kirejs/wire

`@kirejs/wire` brings **stateful server components** to Kire.
It is designed for interactive apps without committing to a large client framework.

## Core Capabilities

- component state hydration/dehydration
- action calls (`wire:click`, `wire:model`)
- effect pipeline (`event`, `stream`, `collection`, `redirect`)
- route navigation with request cancellation
- SSE/socket update transport

## Component Example

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

## Collection Patches

Use `wire:collection` for list updates without full component remorph.

```kire
<template wire:collection="messages" x-for="msg in $wire.messages" :key="msg.id"></template>
<div wire:collection.empty="messages">No messages yet.</div>
```

```ts
this.prependToCollection("messages", message, { key: "id", limit: 25 });
this.$skipRender();
```

## New Utility Directives

- `wire:collection.empty="path"`
- `wire:intersect.top|bottom|left|right` (`down` alias of `bottom`)
- `wire:show="expression"`
- `wire:file.preview="path"`
- `wire:offline` / `wire:online`
- `wire:poll.visible`

## Navigation and History

`wire:navigate` handles client navigation while keeping server authority:

- cancels in-flight requests from old pages
- shows navigation progress
- syncs browser history
- can recover from expired page sessions

## When To Use

Use Wire when:

- state transitions should stay on the server
- you want minimal client complexity
- your team prefers template-first development with explicit actions
