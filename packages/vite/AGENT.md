# Vite + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/vite`

Vite plugin for .kire files (transform, HMR) with a Laravel-style manifest and @vite helper.

## Primary API

```ts
// vite.config.ts
import { kire } from "@kirejs/vite";
export default { plugins: [kire()] };
```

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
