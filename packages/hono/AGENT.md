# Hono + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/hono`

Hono middleware adding c.var.view().

## Primary API

```ts
import { kireHono } from "@kirejs/hono";

app.use(kireHono({ views: "views", wire: { instance: wire } }));
app.get("/", (c) => c.var.view("home"));
```

## Notes

- Web-standard fetch; works on Bun, Node (@hono/node-server), workers.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
