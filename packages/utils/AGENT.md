# Utils — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/utils`

Laravel-like template helpers: Str, Arr, Html, Route, MessageBag.

## Primary API

```ts
import KireUtils from "@kirejs/utils";
kire.plugin(KireUtils);
```

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
