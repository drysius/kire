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

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
