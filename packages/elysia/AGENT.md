# Elysia + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/elysia`

Elysia (Bun) plugin decorating the context with view().

## Primary API

```ts
import { kireElysia } from "@kirejs/elysia";

new Elysia()
  .use(kireElysia({ views: "views", wire: { instance: wire } }))
  .get("/", ({ view }) => view("home"));
```

## Notes

- Context is also decorated with `kire` (the engine).

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
