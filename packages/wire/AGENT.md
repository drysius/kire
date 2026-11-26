# Kirewire — agent guide

> For AI assistants working in this package. Part of the [Kire](https://github.com/drysius/kire) monorepo — see the repository root `CLAUDE.md` for architecture and conventions.

**Package:** `@kirejs/wire`

Server-driven reactive components for Kire (like Livewire). The server holds state; a custom client (signals, no Alpine dependency) applies DOM updates over HTTP/SSE/WebSocket.

## Primary API

```ts
import { Kirewire, LiveComponent, Component, prop } from "@kirejs/wire";

@Component("counter")
class Counter extends LiveComponent {
  @prop count = 0;
  increment() { this.count++; }
  render() { return this.view("counter"); }
}

const wire = new Kirewire({ secret: "…" });
wire.component(Counter);
```

## Notes

- Templates: @wire("name") mounts a component, @kirewireScripts injects the client.
- JavaScript (no decorators): register with ownMeta(Counter).name = "counter".
- Alpine.js interop: start({ alpine }) re-runs Alpine.initTree after each morph; wrap persistent islands in wire:ignore.

## Conventions

- Bun + Biome (tabs, strict TS). Run `bun test` and `bunx biome check` before finishing.
- `noExplicitAny` is off — use `any` without `biome-ignore` suppressions.
- Keep this file and `README.md` in sync with the code.
