# create-kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `create-kire`

Scaffolding CLI: pick a framework template and TypeScript or JavaScript.

## Primary API

```ts
npm create kire@latest
# or non-interactive:
npx create-kire my-app --template express --ts
```

## Notes

- Add a template under templates/<id>/ (meta.json + shared/ + ts/ + js/); it is auto-discovered.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
