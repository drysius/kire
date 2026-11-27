# Bun + Kire

A starter app rendered by [Kire](https://github.com/drysius/kire) through native
`Bun.serve`, with server-driven reactivity via Kirewire.

```bash
bun install
bun run dev
# open http://localhost:3000
```

## Routes

- `/` — home
- `/about` — a view resolved from a dotted path (`pages.about`)
- `/counter` — a reactive Kirewire component
- `/showcase` — `@foreach`, `@if/@else`, JSON output and a live component viewer

## How it's wired

```ts
const kire = kireBun({ views: "views", wire: { instance: wire } });

Bun.serve({
  async fetch(req, server) {
    const res = await kire.wire(req, server);
    if (res !== null) return res; // Kirewire endpoints (and WS upgrade)
    // ...your routes, returning kire.view(...)
  },
  websocket: kire.websocket,
});
```

There is no framework router — you compose `kire.wire` and `kire.view` into your
own `fetch`. Views are Blade-style `.kire` templates in `views/`; the Kirewire
client runtime is auto-served and `@kirewireScripts` injects it. Bun owns its
server, so enabling `wire.ws` gives you the WebSocket transport directly.
