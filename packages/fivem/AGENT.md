# FiveM + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/fivem`

FiveM NUI integration — render NUI pages and answer updates via RegisterNuiCallback (no HTTP server).

## Primary API

```ts
import { kireFivem } from "@kirejs/fivem";

const fivem = kireFivem({ views, wire: { instance: wire } });
RegisterNuiCallback(fivem.path, fivem.handler);
SendNuiMessage(JSON.stringify({ type: "page", html: await fivem.render("counter") }));
```

## Notes

- NUI client uses FiveMTransport; see the create-kire `fivem` template.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
