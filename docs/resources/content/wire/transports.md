---
route: "/docs/wire/transports"
title: "Transports (HTTP / SSE / WebSocket)"
description: "Move protocol frames over HTTP, Server-Sent Events, or WebSocket. Framework-agnostic server handlers, the broadcast Hub, and the Web-standard fetch adapter."
tags: ["wire", "transport", "http", "sse", "websocket", "broadcast", "adapter"]
section: "Kirewire"
order: 8
---

# Transports

The protocol is transport-agnostic: client and server only exchange the shapes in
`contracts.ts`. Pick a medium per side.

## Client transports

```ts
import { start, HttpTransport, SseTransport, WebSocketTransport } from "@kirejs/wire/client";

// Plain request/response
start({ transport: new HttpTransport("/_wire", csrfToken) });

// HTTP for sends + SSE channel for server push
start({
  transport: new SseTransport(new HttpTransport("/_wire"), "/_wire/sse"),
  channel: "room:42",
});

// Duplex WebSocket (lowest latency, push built in)
start({ transport: new WebSocketTransport("wss://host/_wire/ws"), channel: "room:42" });
```

`start({ url })` is shorthand for `HttpTransport(url)`.

## Server: the update handler

`handleUpdate` is the framework-agnostic core. Give it the raw body and an
optional request-scoped Kire fork (used to render component views):

```ts
import { handleUpdate } from "@kirejs/wire";

const { status, body } = await handleUpdate(wire, rawBody, kire.fork());
// status: 200 ok · 400 malformed · 419 tampered snapshot · 500 error
```

Convenience wrappers:

- `nodeHttpAdapter(wire, engineFactory?)` → a Node `(req, res)` handler.
- `createFetchHandler(wire, opts)` → a Web-standard `(Request) => Promise<Response>`
  (Bun, Deno, Cloudflare, Hono, Elysia). Serves the update endpoint, an optional
  multipart upload endpoint, and an optional SSE channel.
- `expressAdapter(app, wire, opts)` → registers routes on an Express app.

```ts
import { createFetchHandler, Hub, MemoryFileStore } from "@kirejs/wire";

const handler = createFetchHandler(wire, {
  path: "/_wire",
  uploadPath: "/_wire/upload",
  ssePath: "/_wire/sse",
  store: new MemoryFileStore(),
  hub,
  engineFactory: () => kire.fork(),
});

Bun.serve({ fetch: handler });
```

## Broadcasting with the Hub

`Hub` is an in-memory broadcaster + subscription registry. Pass it to `Kirewire`
so components can `$broadcast`, and let SSE/WebSocket connections subscribe to it.

```ts
import { Hub, serveSse, serveWs } from "@kirejs/wire";

const hub = new Hub();
const wire = new Kirewire({ secret, broadcaster: hub });

// SSE endpoint (framework-agnostic connection abstraction):
serveSse(hub, channel, { write: (frame) => res.write(frame), onClose: (cb) => req.on("close", cb) });

// WebSocket endpoint:
serveWs(wire, hub, { send, onMessage, onClose }, { channel, engineFactory: () => kire.fork() });
```

Swap `Hub` for a Redis/NATS-backed `Broadcaster` to fan out across multiple
servers — anything implementing `publish(push)` works.

## Status codes

| Code | Meaning |
|---|---|
| `200` | Update applied; response carries new snapshots + effects. |
| `400` | Malformed request body. |
| `419` | Snapshot failed verification (tampered/expired). |
| `500` | Component error during the update. |
