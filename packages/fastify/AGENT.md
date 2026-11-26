# Fastify + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/fastify`

Fastify integration with a typed reply.view().

## Primary API

```ts
import { kireFastify } from "@kirejs/fastify";

app.register(kireFastify({ views: "views", wire: { instance: wire } }));
app.get("/", (_q, reply) => reply.view("home"));
```

## Notes

- Also callable as kireFastify(app, options) → returns the engine.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
