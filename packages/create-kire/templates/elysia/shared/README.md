# Elysia + Kire

A starter app rendered by [Kire](https://github.com/drysius/kire) through Elysia,
with server-driven reactivity via Kirewire.

```bash
npm install   # or bun install
npm run dev   # or bun run dev
# open http://localhost:3000
```

## Routes

- `/` — home
- `/about` — a view resolved from a dotted path (`pages.about`)
- `/counter` — a reactive Kirewire component
- `/showcase` — `@foreach`, `@if/@else`, JSON output and a live component viewer

## How it's wired

```ts
app.use(kireElysia({ views: "views", wire: { instance: wire } }));
```

Views are Blade-style `.kire` templates in `views/`. The Kirewire update endpoint
is mounted and the client runtime auto-served; `@kirewireScripts` injects it.
