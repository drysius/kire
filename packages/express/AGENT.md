# Express + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/express`

Express integration: Kire as the view engine plus a typed res.view().

## Primary API

```ts
import { kireExpress } from "@kirejs/express";

app.use(kireExpress({ views: "views", wire: { instance: wire } }));
app.get("/", (_q, res) => res.render("home"));
app.get("/about", (_q, res) => res.view("pages.about"));
```

## Notes

- Also callable as kireExpress(app, options) → returns the engine.
- wire: { instance } mounts Kirewire and auto-serves the client runtime.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
