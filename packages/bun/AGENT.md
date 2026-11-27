# Bun + Kire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/bun`

Native `Bun.serve` integration: a `view()` helper plus one-line Kirewire setup with native WebSocket.

## Primary API

```ts
import { kireBun } from "@kirejs/bun";

const kire = kireBun({ views: "views", wire: { instance: wire, ws: true } });

Bun.serve({
  async fetch(req, server) {
    const res = await kire.wire(req, server);
    if (res !== null) return res; // wire route (or undefined on WS upgrade)
    const { pathname } = new URL(req.url);
    if (pathname === "/") return kire.view("home");
    return new Response("Not Found", { status: 404 });
  },
  websocket: kire.websocket,
});
```

## Notes

- No framework/router — the integration returns `{ engine, view, wire, websocket }`
  for you to compose into `Bun.serve`.
- `kire.wire(req, server)` → `Response` for a wire endpoint, `undefined` after a
  WebSocket upgrade, or `null` for non-wire requests.
- `wire: { instance }` mounts Kirewire and auto-serves the client runtime.
- Bun owns its server, so `wire.ws` works directly when declared — pass
  `kire.websocket` to `Bun.serve`. No `ws` package needed.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
