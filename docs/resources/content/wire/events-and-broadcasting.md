---
route: "/docs/wire/events-and-broadcasting"
title: "Events & Broadcasting"
description: "Dispatch events between components with $dispatch and @on, and push updates from the server to many clients with broadcastTo over SSE/WebSocket."
tags: ["wire", "events", "dispatch", "broadcast", "realtime"]
section: "Kirewire"
order: 6
---

# Events & Broadcasting

## Dispatching events

A component emits an event with `$dispatch`; any component listening with `@on`
handles it. Events round-trip through the client, so they can cross components.

```ts
@Component("post-form")
export class PostForm extends LiveComponent {
  save() {
    db.posts.insert(/* … */);
    this.$dispatch("post:saved", { id: 1 });
  }
}

@Component("post-list")
export class PostList extends LiveComponent {
  @on("post:saved") reload(payload: { id: number }) {
    this.posts = db.posts.all();
  }
}
```

Targeting helpers:

```ts
this.$dispatch("x");                 // anyone listening
this.$dispatchTo("post-list", "x");  // only components named "post-list"
this.$dispatchSelf("x");             // only this instance
```

From the client you can dispatch too: `$wire.$dispatch("event", payload)`. Every
dispatch also fires a browser event `kirewire:<event>` you can listen to with
plain `addEventListener`.

## Broadcasting (server push)

Events above are request-scoped. To push to **other** connected clients in real
time — live dashboards, notifications, collaborative UIs — use `broadcastTo`. It
delivers over the active push transport (SSE or WebSocket).

Wire up a `Hub` as the broadcaster:

```ts
import { Kirewire, Hub } from "@kirejs/wire";

const hub = new Hub();
const wire = new Kirewire({ secret, broadcaster: hub });
```

Then a component can publish effects to a channel:

```ts
@Component("room")
export class Room extends LiveComponent {
  post(message: string) {
    db.messages.insert(message);
    this.$broadcast?.("room:42", {
      dispatches: [{ event: "message:new", params: [message] }],
    });
  }
}
```

Clients subscribed to that channel receive the push. Connect a client to a channel
with the transport's `channel` option:

```ts
import { start, SseTransport, HttpTransport } from "@kirejs/wire/client";

start({
  transport: new SseTransport(new HttpTransport("/_wire"), "/_wire/sse"),
  channel: "room:42",
});
```

HTTP-only clients (no push channel) can approximate live updates with
[`wire:poll`](/docs/wire/client#wire-poll). See
[Transports](/docs/wire/transports) for SSE/WebSocket setup on the server.
