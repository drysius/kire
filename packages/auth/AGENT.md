# Auth — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/auth`

Authentication directives for Kire (@auth, @guest, @can, …).

## Primary API

```ts
import { KireAuth } from "@kirejs/auth";
kire.plugin(KireAuth, { getUser, canPerm });
```

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
