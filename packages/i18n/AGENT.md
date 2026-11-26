# i18n — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/i18n`

Localization: @lang, @choice and __() / trans() / trans_choice() with placeholders and Laravel-style pluralization.

## Primary API

```ts
import { KireI18n } from "@kirejs/i18n";

kire.plugin(KireI18n, { locale: "pt", fallback: "en", translations: { pt: { msg: { hi: "Olá, :name!" } } } });
// template: @lang("msg.hi", { name: user.name })
```

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
