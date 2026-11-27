# @kirejs/h3

h3 (unjs) integration returning { view, middleware }.

```bash
npm install @kirejs/h3
```

```ts
import { kireH3 } from "@kirejs/h3";

const { view, middleware } = kireH3({ views: "views", wire: { instance: wire } });
app.use(middleware);
app.get("/", () => view("home"));
```

### WebSocket transport (optional)

Enable with `wire.ws`. h3 doesn't own its server, so pass the Node `http.Server`
and install [`ws`](https://www.npmjs.com/package/ws); the client then connects
over WebSocket. Without a `server` it warns and stays on HTTP.

```ts
import { createServer } from "node:http";
const server = createServer(/* your h3 handler */);
kireH3({ views: "views", wire: { instance: wire, ws: { server } } });
server.listen(3000);
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
