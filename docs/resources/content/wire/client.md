---
route: "/docs/wire/client"
title: "Client Runtime & Directives"
description: "Boot the Kirewire browser runtime, the wire:* directive set (click, model, loading, poll, init, confirm, ignore, key), and the built-in signal reactivity."
tags: ["wire", "client", "directives", "wire:click", "wire:model", "wire:loading"]
section: "Kirewire"
order: 7
---

# Client Runtime & Directives

## Booting

The client runtime discovers components in the DOM (`wire:snapshot` markers),
binds directives, and batches interactions into pooled requests.

```ts
import { start } from "@kirejs/wire/client";

start({
  url: "/_wire",        // update endpoint (HttpTransport)
  token: csrfToken,     // optional, sent with every request
});
```

It auto-starts on `DOMContentLoaded` and exposes `window.Kirewire`
(`{ runtime, start, find(id) }`). For SSE/WebSocket pass a `transport` and a
`channel` — see [Transports](/docs/wire/transports).

Inject the bundled script with `@kirewireScripts` in your layout, or serve the
built `@kirejs/wire/client` bundle yourself.

## Directives

### `wire:click` / `wire:submit` / `wire:change` …

Bind a DOM event to an action or expression. `wire:submit` calls
`preventDefault()` for you.

```html
<button wire:click="increment">+1</button>
<button wire:click="remove(item.id)">Delete</button>
<form wire:submit="save">…</form>
<button wire:click="$set('open', true)">Open</button>
```

Bare method names are called; arbitrary expressions are evaluated with `$wire`
and `$event` in scope.

### `wire:model[.live|.blur|.lazy]`

Two-way bind an input to a `@prop`. By default the value stays local until the
next action; `.live` syncs on input, `.blur` on blur, `.lazy` on change. On
`<input type="file">` it uploads instead — see [File uploads](/docs/wire/file-uploads).

```html
<input wire:model.live="q" />
<input type="checkbox" wire:model="agree" />
<input type="number" wire:model.live="qty" />
```

### `wire:loading`

Shows the element only while a request for its component is in flight.

```html
<button wire:click="save">Save</button>
<span wire:loading class="loading loading-spinner"></span>
```

### `wire:poll[.Nms]`

Refreshes the component on an interval (default 2000ms). With an expression it
evaluates that instead of `$refresh`.

```html
<div wire:poll.5000ms></div>
<div wire:poll="tick"></div>
```

### `wire:init`

Runs an expression once when the element is bound — used by `@lazy` placeholders
and for kick-off loads.

```html
<div wire:init="$call('load')"></div>
```

### `wire:confirm`

On an element that also has `wire:click`, gates the action behind a `confirm()`.

```html
<button wire:click="destroy" wire:confirm="Delete this permanently?">Delete</button>
```

### `wire:ignore`

Tells the morph to leave a subtree alone — useful for third-party widgets that
manage their own DOM.

```html
<div wire:ignore><div id="map"></div></div>
```

### `wire:key`

Stabilizes element identity inside lists so morphing preserves state and focus.

```html
@for(row of rows)
  <li wire:key="{{ row.id }}">{{ row.label }}</li>
@end
```

## Reactivity & morphing

The client ships a tiny signal core (`reactive`, `effect`, `computed`, `watch`)
backing `wire:model` and `$wire.$watch`/`$entangle` — no Alpine required. Server
responses are applied by a standalone DOM **morph** keyed by
`wire:key` > `wire:id` > `id`, preserving input focus/selection and `wire:ignore`
subtrees.
