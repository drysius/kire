# h3 + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/h3`

h3 (unjs) integration returning { view, middleware }.

## Primary API

```ts
import { kireH3 } from "@kirejs/h3";

const { view, middleware } = kireH3({ views: "views", wire: { instance: wire } });
app.use(middleware);
app.get("/", () => view("home"));
```

## Notes

- Targets h3 v2 (new H3(), app.get, serve).

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
