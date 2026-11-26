# @kirejs/express

Express integration: Kire as the view engine plus a typed res.view().

```bash
npm install @kirejs/express
```

```ts
import { kireExpress } from "@kirejs/express";

app.use(kireExpress({ views: "views", wire: { instance: wire } }));
app.get("/", (_q, res) => res.render("home"));
app.get("/about", (_q, res) => res.view("pages.about"));
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
