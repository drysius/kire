# @kirejs/bun

Native `Bun.serve` integration: a `view()` helper plus one-line Kirewire setup with native WebSocket.

```bash
bun add @kirejs/bun
```

```ts
import { kireBun } from "@kirejs/bun";

const kire = kireBun({ views: "views", wire: { instance: wire } });

Bun.serve({
  async fetch(req, server) {
    const res = await kire.wire(req, server);
    if (res !== null) return res; // wire route (or undefined on WS upgrade)
    const { pathname } = new URL(req.url);
    if (pathname === "/") return kire.view("home", { title: "Hi" });
    if (pathname === "/about") return kire.view("pages.about");
    return new Response("Not Found", { status: 404 });
  },
  websocket: kire.websocket, // undefined unless wire.ws is enabled
});
```

There is no framework router — you compose the returned pieces into your own
`fetch`. `kire.wire(req, server)` returns a `Response` for a Kirewire endpoint,
`undefined` when it performed a WebSocket upgrade (return it), or `null` when the
request is yours to route.

### WebSocket transport (optional)

Bun owns its server, so WebSocket works directly when declared — set `wire.ws`
and pass `kire.websocket` to `Bun.serve`. The injected client script connects
over Bun's native WebSocket. No extra dependency needed.

```ts
const kire = kireBun({ views: "views", wire: { instance: wire, ws: true } });
Bun.serve({ fetch: /* …compose kire.wire… */, websocket: kire.websocket });
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
