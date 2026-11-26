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

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
