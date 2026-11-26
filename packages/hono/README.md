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

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
