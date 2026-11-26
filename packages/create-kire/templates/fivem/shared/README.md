# FiveM + Kire (NUI)

A FiveM resource whose NUI (browser UI) is rendered by [Kire](https://github.com/drysius/kire)
with server-driven reactivity via Kirewire. FiveM has no HTTP server — the NUI
talks to the resource through `RegisterNuiCallback`, bridged by `@kirejs/fivem`.

## Build & install

```bash
npm install   # or bun install
npm run build # bundles dist/server.js and nui/client.js
```

Then copy/symlink this folder into your server's `resources/` and add
`ensure <this-resource>` to `server.cfg`. In-game, run the `/counter` command to
open the UI.

## How it works

- `server.ts` creates a `Kirewire`, registers the `Counter` component, and wires
  it up with `kireFivem({ views, wire })`:
  ```ts
  RegisterNuiCallback(fivem.path, fivem.handler);          // handle wire:click
  SendNuiMessage(JSON.stringify({ type: "page", html })); // push a rendered page
  ```
- `nui/index.html` injects the pushed HTML and runs the bundled Kirewire client
  (`nui/client.js`, built from `nui-boot.ts`) which uses the FiveM NUI transport.
- `views/counter.kire` is the NUI page; `@wire("counter")` mounts the component.

Persistent Alpine.js islands (if you add any) should be wrapped in `wire:ignore`.
