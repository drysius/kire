# @kirejs/fastify

Fastify integration with a typed reply.view().

```bash
npm install @kirejs/fastify
```

```ts
import { kireFastify } from "@kirejs/fastify";

app.register(kireFastify({ views: "views", wire: { instance: wire } }));
app.get("/", (_q, reply) => reply.view("home"));
```

### WebSocket transport (optional)

Fastify owns its server, so WebSocket works directly when declared — just set
`wire.ws` and install [`@fastify/websocket`](https://www.npmjs.com/package/@fastify/websocket).
The injected client script connects over WebSocket automatically.

```ts
app.register(kireFastify({ views: "views", wire: { instance: wire, ws: true } }));
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
