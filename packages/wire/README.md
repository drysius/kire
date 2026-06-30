# @kirejs/wire — Kirewire

Server-driven reactive components for [Kire](../../core). Components live on the
server; the browser sends actions and morphs returned HTML. Built-in signal
reactivity (no Alpine dependency) and first-class SSE/WebSocket transport.

See [`../../REACTIVE-DESIGN.md`](../../REACTIVE-DESIGN.md) for the full architecture.

## Define a component

```ts
import { LiveComponent, Component, prop, locked, computed, on } from "@kirejs/wire";

@Component("counter")
export class Counter extends LiveComponent {
  @prop count = 0;
  @locked @prop userId!: string;

  mount(p: { userId: string }) { this.userId = p.userId; }
  increment() { this.count++; }
  @computed get doubled() { return this.count * 2; }
  @on("reset") reset() { this.count = 0; }

  render() { return this.view("components.counter"); }
}
```

## Server wiring

```ts
import { Kire } from "kire";
import { Kirewire, kirewirePlugin, handleUpdate, Hub } from "@kirejs/wire";

const hub = new Hub();
const wire = new Kirewire({ secret: process.env.APP_SECRET!, broadcaster: hub });
wire.component(Counter);

const kire = new Kire({ root: "views" });
kire.plugin(kirewirePlugin(wire, { scriptUrl: "/kirewire.js" }));

// Render a page (SSR): `@wire("counter", { userId })` / `<wire:counter :user-id="id" />`
// Update endpoint:
app.post("/_wire", async (req, res) => {
  const { status, body } = await handleUpdate(wire, req.body, kire.fork());
  res.status(status).json(body);
});
```

## Client

```html
<script type="module">
  import { start } from "@kirejs/wire/client";
  start({ url: "/_wire" });          // HTTP
  // start({ transport: new WebSocketTransport("wss://…"), channel: "room:42" });
</script>
```

Directives: `wire:click`, `wire:submit`, `wire:model[.live|.blur|.lazy]`,
`wire:init`, `wire:poll[.Nms]`, `wire:loading`, `wire:ignore`, `wire:key`.

## Security

HMAC-signed snapshots (tamper-rejected with 419), method gating (`_`/`$`/reserved
blocked, `@action` allowlist), `@locked` mass-assignment protection, `@validate`
rules, and a synth allowlist for class hydration.
