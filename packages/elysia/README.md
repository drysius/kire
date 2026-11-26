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

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
