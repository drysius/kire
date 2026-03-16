# Wire Features

`packages/wire` already has the primitives needed for pluggable features, but they were scattered:

- server references: `wire.reference(...)`
- server routes: `wire.route(...)`
- component properties: `wire.class(...)`
- client directives: `Kirewire.directive(...)`
- client lifecycle/events: `Kirewire.$on(...)`

The missing part was a clear pattern. The `file preview` flow is now the reference implementation:

- server transport exposes `wire:preview-url`
- HTTP adapter serves `GET /preview?id=...`
- client runtime stores `previewUrl` in config/meta
- `wire:file.preview` resolves `WireFile.id` through that endpoint
- upload feature can seed a local `File` object before the server responds

## Minimal Feature Shape

A feature should be split into two files:

- server/runtime side: `src/features/<feature>.ts`
- browser/runtime side: `web/features/<feature>.ts`

The server file owns routes, references, property classes and server hooks.
The browser file owns directives, DOM behavior and client events.

## Example: Echo Feature

### Server

```ts
// packages/wire/src/features/echo.ts
import type { Kirewire } from "../kirewire";

export function registerEchoFeature(wire: Kirewire) {
    wire.reference("wire:echo-url", ({ adapter }) => {
        const base = typeof adapter?.getClientUrl === "function"
            ? String(adapter.getClientUrl())
            : "/_wire";
        return `${base.replace(/\/+$/, "")}/echo`;
    });

    wire.route("wire.echo", {
        method: "POST",
        path: "/_wire/echo",
        async handler(ctx) {
            return {
                status: 200,
                result: {
                    ok: true,
                    body: ctx.body,
                },
            };
        },
    });
}
```

### Client

```ts
// packages/wire/web/features/echo.ts
import { Kirewire } from "../kirewire";

Kirewire.directive("echo", ({ el, expression }) => {
    el.addEventListener("click", async () => {
        const url = Kirewire.getUploadUrl().replace(/\/upload$/, "/echo");
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: expression }),
        });
    });
});
```

### Boot

Register the server part from the plugin load path and import the client part from `web/index.ts`.

That keeps the feature transport-aware without coupling its logic to `HttpAdapter`, `SocketAdapter` or app code.

## Design Rules

1. Put transport URLs behind `wire.reference(...)`.
2. Put server endpoints behind `wire.route(...)` or adapter endpoints.
3. Keep browser DOM logic in `web/features/*` or `web/directives/*`.
4. If a feature needs temporary files, expose a preview URL and keep the file state serializable.
5. If a feature needs optimistic UI, store temporary client-only data in the proxy target and let the next server sync replace it.

## Current Reference Files

- server preview: `packages/wire/src/adapters/http.ts`
- client preview rendering: `packages/wire/web/directives/file.ts`
- optimistic file preview seed: `packages/wire/web/features/file-upload.ts`
