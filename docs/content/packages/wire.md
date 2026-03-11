# @kirejs/wire

`@kirejs/wire` adds server-driven components to Kire, inspired by Livewire style APIs.

## Purpose

- Stateful server components.
- Client-server action calls (`wire:click`, `wire:model`, etc.).
- Batching, streaming, events and component hydration.

## Core Concepts

- Server `Component` classes with state.
- `@wire("component")` to mount components in templates.
- Effects pipeline for redirect, events and stream updates.
- HTTP or socket transport adapters.

## Recent Runtime Improvements

- native `wire:navigate` route transitions
- cancellation of old requests when navigating
- progress bar during navigation
- session-expired recovery by refreshing current route via navigate
- `wire:collection` for append/prepend/upsert/remove list patches without full remorph

## Collection Patches

Use `wire:collection` when a component needs to update a list frequently and a full HTML remorph would be wasteful.

```html
<template wire:collection="entries" x-for="entry in $wire.entries" :key="entry.id">
  <article x-text="entry.text"></article>
</template>
```

```ts
this.prependToCollection("entries", entry, { key: "id", limit: 25 });
this.$skipRender();
```

For keyed DOM fragments, the same effect can target a regular container marked with `wire:collection="..."`.

## Typical Use

Use when you want server logic to own state transitions while keeping frontend JS light.
