# @kirejs/hono

Hono middleware adding c.var.view().

```bash
npm install @kirejs/hono
```

```ts
import { kireHono } from "@kirejs/hono";

app.use(kireHono({ views: "views", wire: { instance: wire } }));
app.get("/", (c) => c.var.view("home"));
```

### WebSocket transport (optional)

Enable with `wire.ws`. On Node, Hono runs behind a server it doesn't own, so
pass the Node `http.Server` and install [`ws`](https://www.npmjs.com/package/ws);
the client then connects over WebSocket. Without a `server` it warns and stays
on HTTP.

```ts
import { serve } from "@hono/node-server";
const server = serve({ fetch: app.fetch, port: 3000 });
app.use(kireHono({ views: "views", wire: { instance: wire, ws: { server } } }));
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
