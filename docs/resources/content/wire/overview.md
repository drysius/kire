---
route: "/docs/wire/overview"
title: "Kirewire Overview"
description: "Server-driven reactive components for Kire: state lives on the server, the browser sends actions and morphs returned HTML. Signals client, SSE/WebSocket transport."
tags: ["wire", "kirewire", "reactive", "components", "livewire"]
section: "Kirewire"
order: 1
---

# Kirewire

Kirewire (`@kirejs/wire`) is a server-driven reactive component layer for Kire,
in the spirit of Laravel Livewire — but re-architected for TypeScript:

- **State lives on the server.** Components are classes; their public properties
  are the state, their public methods are actions the browser can call.
- **The browser is thin.** It sends actions, receives a re-rendered HTML fragment,
  and morphs it into the DOM. No virtual DOM, no client routing.
- **No Alpine dependency.** Kirewire ships its own tiny signal reactivity.
- **Transport is first-class.** HTTP, Server-Sent Events, and WebSocket are all
  supported, with real server→client push (`broadcastTo`).

## Mental model

```
Browser: wire:click  ──POST /_wire──▶  Server: hydrate → call method → re-render
Browser: morph DOM   ◀──snapshot+html─  Server: dehydrate → signed snapshot + effects
```

Each component instance carries a **snapshot**: its serialized, HMAC-signed state.
The client echoes the snapshot on every request; the server verifies it, applies
the action, and returns a fresh snapshot plus effects (new HTML, events, …).

## Install

```bash
bun add @kirejs/wire
```

## Your first component

```ts
import { LiveComponent, Component, prop } from "@kirejs/wire";

@Component("counter")
export class Counter extends LiveComponent {
  @prop count = 0;

  increment() { this.count++; }

  render() { return this.view("components.counter"); }
}
```

`components/counter.kire`:

```html
<div>
  <p class="text-2xl">{{ count }}</p>
  <button wire:click="increment" class="btn btn-primary">+1</button>
</div>
```

## Wire it to a server

```ts
import { Kire } from "kire";
import { Kirewire, kirewirePlugin, handleUpdate } from "@kirejs/wire";
import { Counter } from "./counter";

const wire = new Kirewire({ secret: process.env.APP_SECRET! });
wire.component(Counter);

const kire = new Kire({ root: "views" });
kire.plugin(kirewirePlugin(wire, { scriptUrl: "/kirewire.js" }));

// Render a page that mounts the component (SSR):
//   @wire("counter")            (directive)
//   <wire:counter />            (element)

// The update endpoint the browser POSTs to:
app.post("/_wire", async (req) => {
  const { status, body } = await handleUpdate(wire, await req.text(), kire.fork());
  return new Response(JSON.stringify(body), { status });
});
```

## Boot the client

```html
<script type="module">
  import { start } from "@kirejs/wire/client";
  start({ url: "/_wire" });
</script>
```

Or inject it with `@kirewireScripts` in your layout.

## Where to go next

- [Components & lifecycle](/docs/wire/components)
- [Decorators](/docs/wire/decorators)
- [Actions, `$wire` & magic](/docs/wire/actions-and-state)
- [Validation & forms](/docs/wire/validation-and-forms)
- [Events & broadcasting](/docs/wire/events-and-broadcasting)
- [Client runtime & directives](/docs/wire/client)
- [Transports (HTTP / SSE / WebSocket)](/docs/wire/transports)
- [File uploads](/docs/wire/file-uploads)
- [Security model](/docs/wire/security)
