---
route: "/docs/packages/wire"
title: "@kirejs/wire"
description: "Server-driven reactive components for Kire — Kirewire. Signals client, SSE/WebSocket transport, class + decorator API."
tags: ["wire", "kirewire", "reactive", "components", "package"]
section: "Packages"
order: 2
---

# @kirejs/wire

Kirewire adds **server-driven reactive components** to Kire. State lives on the
server as classes; the browser sends actions and morphs the returned HTML. It
ships its own signal reactivity (no Alpine) and first-class SSE/WebSocket
transport with real server push.

```bash
bun add @kirejs/wire
```

```ts
import { LiveComponent, Component, prop } from "@kirejs/wire";

@Component("counter")
export class Counter extends LiveComponent {
  @prop count = 0;
  increment() { this.count++; }
  render() { return this.view("components.counter"); }
}
```

This package has its own documentation section — **[Kirewire](/docs/wire/overview)**:

- [Overview & first component](/docs/wire/overview)
- [Components & lifecycle](/docs/wire/components)
- [Decorators](/docs/wire/decorators)
- [Actions, `$wire` & magic](/docs/wire/actions-and-state)
- [Validation & forms](/docs/wire/validation-and-forms)
- [Events & broadcasting](/docs/wire/events-and-broadcasting)
- [Client runtime & directives](/docs/wire/client)
- [Transports (HTTP / SSE / WebSocket)](/docs/wire/transports)
- [File uploads](/docs/wire/file-uploads)
- [Security & synthesizers](/docs/wire/security)
