# Express + Kire

A starter app rendered by [Kire](https://github.com/drysius/kire) through Express,
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
app.use(kireExpress({ views: "views", wire: { instance: wire } }));
```

One call sets up Kire as the Express view engine (so `res.render` works),
adds `res.view("dotted.path")`, mounts the Kirewire update endpoint and serves
its client runtime. Views are Blade-style `.kire` templates in `views/`.
