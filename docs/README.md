# Kire Docs

The Kire documentation site — rendered by Kire itself, styled with DaisyUI,
organized Laravel-style.

## Layout

```
app/
  config/        one flat file per concern (app, server, docs) → composed in index.ts
  console/       CLI dispatcher (bun run console <cmd>) + serve boot
  http/
    kernel.ts    buildApp(): static assets + error envelope + routes
    controllers/ Elysia plugins (home, docs) — default-export a plugin
    response.ts  html() helper
  providers/
    kire.ts      the configured Kire engine (singleton) + markdown plugin
  routes/
    web.ts       lazy () => import() controller table → registerWeb(app)
  services/
    content/     markdown loading, frontmatter, nav groups, neighbors, search
resources/
  views/         Kire templates (layouts/ pages/ partials/) — DaisyUI shell
  content/       markdown docs (frontmatter: route/title/section/order/tags)
public/          static assets (served at /public)
main.ts          entry → console serve
```

Path alias: `#app/*` → `./app/*` (see `package.json` imports + `tsconfig` paths).

## Run

```
bun run dev        # watch mode
bun run start      # production (NODE_ENV=production)
bun run console serve
```

→ http://localhost:3000

## Add a docs page

Drop a markdown file under `resources/content/<section>/<slug>.md` with frontmatter:

```md
---
route: "/docs/kire/my-page"
title: "My Page"
description: "…"
section: "Kire Essentials"
order: 5
tags: ["kire"]
---

# My Page
```

The sidebar, search index, and prev/next links pick it up automatically (sorted by
`config.docs.sectionOrder` then `order`).

## Styling

DaisyUI v4 (full CSS) + Tailwind Play CDN + typography, loaded in
`resources/views/layouts/app.kire`. Theme toggling persists to `localStorage`.
