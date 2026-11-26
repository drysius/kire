---
name: kire-integration
description: Create a new framework integration package (@kirejs/<fw>) that wires Kire into a web framework (router/server) with a view() helper and optional one-line Kirewire setup. Use when the user asks to integrate Kire with a framework or add a @kirejs router package.
---

# Create a @kirejs/<fw> integration package

Mirror `packages/express` (and `packages/fastify` for the dual-signature + typed
`view` pattern). See their `AGENT.md` files.

## Files (packages/<fw>/)

- `package.json`: name `@kirejs/<fw>`, version matching the current release,
  `dependencies: { "kire": "workspace:../../core" }`, `peerDependencies` with the
  framework and `@kirejs/wire` (optional via `peerDependenciesMeta`). Add
  `@kirejs/wire` as a `devDependencies: { "@kirejs/wire": "workspace:*" }` so it
  links in the monorepo.
- `tsconfig.json`: same as `packages/express/tsconfig.json`.
- `src/types.ts`: `Kire<Fw>Options` = `{ views, extension?, production?, engine?,
  plugins?, globals?, wire? }` plus `PluginEntry` and `WireIntegration`. `noExplicitAny`
  is off — use `any` directly, no `biome-ignore` comments.
- `src/index.ts`: `kire<Fw>(options)` builds the engine once (load plugins + globals),
  adds a `view(name, data)` helper to the framework's response/context, and augments
  the framework's types so it is typed. When `options.wire` is set, lazily
  `require("@kirejs/wire")`, load `kirewirePlugin({ scriptUrl, path })`, mount the
  update endpoint, and auto-serve the client bundle (reuse express's
  `resolveClientScript`, which derives `<pkg>/dist/client/auto.js`).
- `tests/<fw>.test.ts`: boot the app, render a view through the `view()` helper, and
  assert the HTML + `text/html` content type. Do not test the wire path.

## Wire up

- Install the framework as a dev dependency at the repo root first (so tests run),
  then `bun install` to link the new package.
- Add `packages/<fw>/src` and `packages/<fw>/tests` to the root `package.json` biome
  scripts.
- Verify: `bun test packages/<fw>/tests`, `bunx tsc --noEmit -p packages/<fw>/tsconfig.json`,
  `bunx biome check packages/<fw>` — all clean.
- Add an `AGENT.md` + `README.md`, and consider a matching `create-kire` template.
