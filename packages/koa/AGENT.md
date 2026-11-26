# Koa + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/koa`

Koa middleware adding ctx.view().

## Primary API

```ts
import { kireKoa } from "@kirejs/koa";

app.use(kireKoa({ views: "views", wire: { instance: wire } }));
router.get("/", (ctx) => ctx.view("home"));
```

## Notes

- Needs a body parser (e.g. koa-bodyparser) upstream for the Kirewire endpoint.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
