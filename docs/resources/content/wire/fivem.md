---
route: "/docs/wire/fivem"
title: "FiveM (NUI)"
description: "Run Kirewire inside a FiveM resource: NUI talks to the client script over RegisterNUICallback, server push via SendNuiMessage. FiveMTransport + createFiveMHandler + FiveMBroadcaster."
tags: ["wire", "fivem", "nui", "transport", "cfx"]
section: "Kirewire"
order: 11
---

# FiveM (NUI)

Kirewire runs inside a FiveM resource using NUI as the transport — no HTTP server
needed. The browser UI (NUI) sends updates to the resource's client script via a
NUI callback, and the script pushes back with `SendNuiMessage`.

```
NUI (browser)  ──fetch https://<resource>/_wire──▶  client script: kirewire.handle()
NUI (browser)  ◀──SendNuiMessage({type:"kirewire:push"})──  broadcast
```

## Client script (FiveM JS runtime)

Run the Kirewire instance in your resource's **client** script and register a NUI
callback for it:

```ts
import { Kirewire, createFiveMHandler, FiveMBroadcaster } from "@kirejs/wire";
import { Counter } from "./components/counter";

declare const RegisterNuiCallback: (name: string, cb: (data: unknown, cb: (r: unknown) => void) => void) => void;
declare const SendNuiMessage: (json: string) => void;
declare const GetConvar: (key: string, def: string) => string;

const hub = new FiveMBroadcaster((json) => SendNuiMessage(json));
const wire = new Kirewire({ secret: GetConvar("kirewire_secret", "change-me"), broadcaster: hub });
wire.component(Counter);

// NUI → here. The callback's response becomes the fetch() body.
RegisterNuiCallback("_wire", createFiveMHandler(wire));
```

`createFiveMHandler(wire)` runs the full update pipeline (`verify → hydrate →
call → render → dehydrate`) and answers through the NUI callback. To push to all
open NUIs, call `component.$broadcast(channel, effects)` — `FiveMBroadcaster`
delivers it via `SendNuiMessage`.

## NUI (the browser bundle)

In your NUI HTML, boot the client with the FiveM transport instead of HTTP:

```html
<script type="module">
  import { start, FiveMTransport } from "@kirejs/wire/client";
  start({ transport: new FiveMTransport(), channel: "global" });
</script>
```

`FiveMTransport` posts to `https://<resource>/_wire` (resolving the resource name
from FiveM's `GetParentResourceName()`) and listens for push frames on the
window's `message` event. The callback name defaults to `_wire`:

```ts
new FiveMTransport(GetParentResourceName(), "_wire");
```

## Server-authoritative state (optional)

NUI talks to the **client** script. To make game-server logic authoritative,
relay inside the callback: have `createFiveMHandler` forward the request to the
server with `TriggerServerEvent`/`onNet`, run Kirewire on the server, and return
the response back through the client. The transport contract is unchanged — only
where `kirewire.handle()` runs moves.

## Mounting

Render the initial HTML for the NUI with the `@wire`/`<wire:*>` SSR helpers (run
the Kire engine in your build step or client script) so each component ships with
its signed snapshot, exactly as on the web.
