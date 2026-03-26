# @kirejs/wire

`@kirejs/wire` adds a reactive component runtime to Kire.

It is the package behind:

- `@wire(...)`
- `@kirewire()`
- `<wire:... />`
- `<kirewire:... />`
- `<livewire:... />`
- `wire:*` attributes such as `wire:model`, `wire:click`, `wire:poll`, and `wire:navigate`
- server/client hydration for interactive components
- adapters for HTTP, SSE, sockets, Express, Koa, Elysia, FiveM, and vanilla runtimes

## What It Adds

- component registration and lifecycle
- public state hydration through `wire:id` and `wire:state`
- attribute-driven actions, polling, navigation, loading states, intersection observers, uploads, collections, and broadcast channels
- typed runtime access through `$wire`
- schema docs for `wire:*` attributes consumed by `KIRE IntelliSense`

## Typical Usage

```ts
import { Kire } from "kire";
import { KirewirePlugin } from "@kirejs/wire";
import { HttpAdapter } from "@kirejs/wire";

const kire = new Kire({ root: "views" }).plugin(
	new KirewirePlugin({
		secret: "dev-secret",
		adapter: new HttpAdapter({
			route: "/_wire",
		}),
	}),
);
```

```kire
@kirewire()

@wire("chat-room", { roomId: room.id })

<wire:chat-room room-id="{{ room.id }}" />
<livewire:chat-room room-id="{{ room.id }}" />

<a href="/dashboard" wire:navigate>Dashboard</a>
<input wire:model.live="search" />
<button wire:click="save">Save</button>
```

This package ships a `kire.schema.js` file plus element and attribute documentation so the VS Code extension can explain both the custom mount tags and the `wire:*` directives/modifiers.

## License

MIT
