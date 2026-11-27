# @kirejs/koa

Koa middleware adding ctx.view().

```bash
npm install @kirejs/koa
```

```ts
import { kireKoa } from "@kirejs/koa";

app.use(kireKoa({ views: "views", wire: { instance: wire } }));
router.get("/", (ctx) => ctx.view("home"));
```

### WebSocket transport (optional)

Enable with `wire.ws`. Koa doesn't own its server, so pass the Node
`http.Server` and install [`ws`](https://www.npmjs.com/package/ws); the client
then connects over WebSocket. Without a `server` it warns and stays on HTTP.

```ts
const server = app.listen(3000);
app.use(kireKoa({ views: "views", wire: { instance: wire, ws: { server } } }));
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
