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

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
