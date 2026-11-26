---
name: create-kire-template
description: Add a new starter template to the create-kire scaffolding CLI (a framework or variant users can pick with `npm create kire`). Use when the user asks to add a create-kire template or a new scaffold.
---

# Add a create-kire template

Templates live under `packages/create-kire/templates/<id>/` and are
auto-discovered by the CLI (`packages/create-kire/src/index.ts`).

## Layout

```
templates/<id>/
  meta.json          { "title": "...", "description": "..." }
  shared/            copied verbatim into the project (language-agnostic)
    views/           .kire templates
    README.md
    gitignore        (restored to .gitignore on scaffold)
    ...
  ts/                copied over shared/ when TypeScript is picked
    main.ts, counter.ts, package.json, tsconfig.json
  js/                copied over shared/ when JavaScript is picked
    main.js, counter.js, package.json
```

## Rules

- Put everything language-agnostic (views, README, static files) in `shared/`.
- Put entry/component/package files in `ts/` and `js/`. In `ts/` use the
  `@Component`/`@prop` decorators; in `js/` use `ownMeta(Counter).name = "..."`.
- Use the **published** package names (`@kirejs/<fw>`, `@kirejs/wire`, `kire`) in
  imports and dependencies — not workspace relative paths.
- Dependency ranges should match the current release (e.g. `^0.2.0`).

## Verify

```bash
cd packages/create-kire && bun run build
# in a temp dir:
bun run <repo>/packages/create-kire/dist/index.js demo --template <id> --ts --ai none
```

Confirm the scaffolded files are correct (the CLI stamps the project name into
`package.json` and restores `.gitignore`).
