# Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `kire`

Compile-to-JS, Blade-style template engine. Templates compile to optimized JS functions.

## Primary API

```ts
import { Kire } from "kire";

const kire = new Kire({ root: "views" });
const html = await kire.view("home", { title: "Hi" });
// or: await kire.render("{{ greeting }}", { greeting: "hey" });
```

## Notes

- Directives/elements carry schema metadata that powers the vs-kire editor tooling.
- Before changing the compiler, follow the AST → compiled-code → test methodology in the root CLAUDE.md.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
