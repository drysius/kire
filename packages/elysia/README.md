# @kirejs/elysia

Elysia (Bun) plugin decorating the context with view().

```bash
npm install @kirejs/elysia
```

```ts
import { kireElysia } from "@kirejs/elysia";

new Elysia()
  .use(kireElysia({ views: "views", wire: { instance: wire } }))
  .get("/", ({ view }) => view("home"));
```

### WebSocket transport (optional)

Elysia owns its (Bun) server, so WebSocket works directly when declared — set
`wire.ws` and the injected client script connects over Elysia's native `.ws()`.
No extra dependency needed.

```ts
new Elysia().use(
  kireElysia({ views: "views", wire: { instance: wire, ws: true } }),
);
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
