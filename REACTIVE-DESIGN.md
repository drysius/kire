# Kire Live — Reactive Component System (Design)

A server-driven reactive component layer for Kire, inspired by Laravel Livewire v3
but **re-architected** for TypeScript, class+decorator ergonomics, transport
independence, and zero hard dependency on Alpine.js.

> Lives in **`packages/wire`** (in-place rewrite, keeps the `kirewire` name). The
> existing contents are replaced from scratch — none of the old implementation is
> reused or referenced.

### Confirmed decisions
1. **Reactivity:** own tiny signals; Alpine is an optional adapter only.
2. **Transport:** SSE + WebSocket are first-class from v1 (push/broadcast built
   into the protocol and pipeline from the start); HTTP is the simple fallback.
3. **Package:** rewrite `packages/wire` in place; keep the name.

---

## 0. Design goals (improvements over Livewire)

| # | Livewire v3 weakness | Kire Live decision |
|---|---|---|
| 1 | Client is **hard-coupled to Alpine.js** (reactive(), morph, entangle, evaluate) | Ship a **tiny built-in signal reactivity** + morph. Alpine is an *optional adapter*, not a requirement. |
| 2 | Transport is **HTTP-only**; streaming bolted on via a header hack | **Transport is an interface** from day 1: `Http`, `Sse`, `WebSocket`. Server→client *push/broadcast* is first-class (SSE/WS), not emulated. |
| 3 | PHP `#[Attribute]` reflection, runtime-heavy | **Native TS decorators** + a metadata registry. Fully typed `$wire<T>`. |
| 4 | Features mutate global Laravel container (redirector swap, paginator resolver) | Features are **isolated classes** operating on a per-request `Component` + `Store`. No global mutation. |
| 5 | Snapshot protocol is implicit/versionless | **Versioned, documented wire protocol** (`v` field). One source of truth in `contracts.ts`. |
| 6 | Mixed concerns in giant files | **Strict layering**: protocol / server-core / features / transport / client / kire-integration are separate, each small. |

Non-goals for v1: Eloquent-style model binding, pagination helpers, file uploads
(all land in v1.1 as optional feature packages).

---

## 1. The wire protocol (single source of truth)

Everything else is built around these shapes. Lives in `src/contracts.ts`.

```ts
/** Serialized, tamper-proof component state. */
interface Snapshot {
  v: 1;                                  // protocol version
  data: Record<string, Dehydrated>;      // dehydrated public props
  memo: {                                // non-state metadata (NOT user-writable)
    id: string;                          // component instance id
    name: string;                        // registered component name
    path?: string;                       // template path
    children?: Record<string, [name: string, id: string]>;
    listeners?: string[];                // event names this component listens to
    [k: string]: unknown;                // features append here
  };
  checksum: string;                      // HMAC-SHA256 over {v,data,memo-minus-children}
}

/** A value is either a primitive, or a [value, meta] synthetic tuple. */
type Dehydrated = string | number | boolean | null | SyntheticTuple | Dehydrated[];
type SyntheticTuple = [value: unknown, meta: { s: string; [k: string]: unknown }];

/** One component's slice of an update request. */
interface ComponentRequest {
  snapshot: Snapshot | string;           // client echoes the last snapshot
  updates: Record<string, unknown>;      // dot-path property writes (wire:model)
  calls: Array<{ method: string; params: unknown[]; meta?: { renderless?: boolean } }>;
}

interface UpdateRequest {
  v: 1;
  token?: string;                        // CSRF token
  components: ComponentRequest[];        // batched: many components per round-trip
}

/** Server response per component. */
type ComponentResponse =
  | { id: string; snapshot: Snapshot; effects: Effects }
  | { id: string; skip: true };          // reactive child, nothing changed

interface Effects {
  html?: string;                         // re-rendered HTML (morph target)
  returns?: unknown[];                   // method return values, in call order
  dispatches?: Array<{ event: string; params: unknown[]; to?: string; self?: boolean }>;
  redirect?: { url: string; navigate?: boolean };
  scripts?: string[];
  // features append their own effect keys
}

interface UpdateResponse { v: 1; components: ComponentResponse[]; assets?: string[] }
```

**Why this matters:** client and server only ever speak `contracts.ts`. Transport
adapters serialize/deserialize these; nothing else.

---

## 2. Server architecture

```
packages/live/src/
  contracts.ts            # the protocol above — zero deps
  component.ts            # Component base class (user-facing)
  registry.ts             # name -> component class map; reflection cache
  runtime/
    snapshot.ts           # dehydrate() / hydrate() / takeSnapshot()
    checksum.ts           # HMAC sign + constant-time verify
    pipeline.ts           # the update lifecycle (the heart)
    context.ts            # RequestContext: effects, memo, store, per-call scope
    store.ts              # WeakMap transient state (DataStore equivalent)
    properties.ts         # deep dot-path get/set with synth vivification
  synth/
    synth.ts              # abstract Synthesizer
    registry.ts           # match-by-value / match-by-type resolution
    builtins/             # Date, Map, Set, Array, plain-object, BigInt, Enum-like
  features/
    feature.ts            # abstract Feature (= ComponentHook)
    lifecycle.ts          # mount/boot/booted/updating*/updated* dispatch
    events.ts             # $dispatch / @on
    magic.ts              # $refresh/$set/$toggle/$commit
    locked.ts             # @locked enforcement
    computed.ts           # @computed caching
    validation.ts         # @validate (Zod/TypeBox bridge)
    nesting.ts            # parent/child snapshot tracking
  decorators.ts           # @Component, @prop, @locked, @computed, @on, @validate, @url, @renderless
  transport/
    transport.ts          # abstract Transport
    http.ts               # POST /_live
    sse.ts                # SSE channel for server push
    websocket.ts          # WS duplex
    adapters/             # express / elysia / koa / fivem framework glue
  kire/
    plugin.ts             # kire.plugin() entry — registers directives/elements/client
    directive.ts          # @live(name, props) + <live:*> element codegen
    client-inject.ts      # existVar-based runtime <script> injection
  client/                 # compiled separately to a browser bundle
    index.ts
    component.ts          # client Component (canonical/ephemeral/reactive layers)
    wire.ts               # $wire proxy
    reactivity/           # tiny signals (effect, computed, reactive)
    request/              # message batching, pooling, transport client
    morph.ts              # DOM diff/patch with wire:key
    directives/           # wire:click, wire:model, wire:loading, wire:poll, ...
    interceptors.ts       # client hook bus
    transports/           # http / sse / ws client side
  server.ts               # public server entry
```

### 2.1 Component base class (class-based "ambientação")

```ts
@Component("counter")
export class Counter extends LiveComponent {
  @prop count = 0;                       // reactive, client-writable
  @locked @prop userId!: string;         // client cannot tamper
  @prop step = 1;

  // lifecycle (called by LifecycleFeature)
  mount(p: { userId: string }) { this.userId = p.userId; }
  booted() {}
  updatingCount(v: number) { /* veto/transform */ }
  updatedCount(v: number) {}

  // actions — any public method is callable from the browser unless guarded
  increment() { this.count += this.step; }

  @renderless ping() { /* runs, no re-render */ }

  @computed get doubled() { return this.count * 2; }

  @on("reset") reset() { this.count = 0; }

  // the view: a Kire template path, rendered with this component as scope
  render() { return this.view("components.counter"); }
}
```

Internals (mirroring Livewire, cleaned up):
- `$id`, `$name`, `$kire` (forked, request-scoped), `$context`.
- Public enumerable props = state. Methods = actions. `$`/`_` prefixes are private.
- `view(path, extra?)` renders a Kire template with the component instance as locals
  (props) + framework globals injected (`$errors`, `$dispatch`, computed getters).

### 2.2 The update pipeline (runtime/pipeline.ts) — the heart

Faithful to Livewire's `HandleComponents::update`, restated as pure TS:

```
update(req: ComponentRequest): ComponentResponse
  1. verifyChecksum(req.snapshot)                  // constant-time HMAC; 419 on fail
  2. instance = registry.make(memo.name); instance.$id = memo.id
  3. context = new RequestContext(instance)
  4. hydrate(instance, snapshot.data)              // synth.hydrate per prop
  5. features.fire("hydrate", instance, memo)
  6. for [path, value] of req.updates:
        guard locked/validate via features.fire("update", path, value) -> finisher
        setDeep(instance, path, value)             // properties.ts vivifies + synth
        finisher(value)                            // updated* hooks
  7. for call of req.calls:
        cb = features.fire("call", call) -> earlyReturn?  // magic, authorize
        ret = earlyReturn ?? instance[call.method](...call.params)
        context.returns.push(await ret)
        if call.meta.renderless || @renderless: context.skipRender = true
  8. html = context.skipRender ? undefined : await render(instance, context)
  9. features.fire("dehydrate", instance, context) // events, redirects -> effects
 10. data = dehydrate(instance)                    // synth.dehydrate per prop
 11. snapshot = takeSnapshot(data, memo, context)  // re-sign checksum
 12. return { id, snapshot, effects: context.effects }
```

`mount` (initial SSR) is the same minus steps 1/6/7, plus `pre-mount` (lazy) hook.

### 2.3 Synthesizers (synth/)

Same pattern as Livewire (`[value, {s, ...meta}]` tuples), but the registry is a
plain match list. Built-ins map JS types: `Date`, `Map`, `Set`, `BigInt`, plain
objects, arrays, and a generic "class instance" synth gated by an **allowlist**
(security: never instantiate arbitrary classes from client data).

### 2.4 Features = classes (the hook system)

```ts
abstract class Feature {
  skip?(c: LiveComponent): boolean;
  boot?(c: LiveComponent): void;
  mount?(c: LiveComponent, params: Record<string, unknown>): void;
  hydrate?(c: LiveComponent, memo: Snapshot["memo"]): void;
  update?(c: LiveComponent, path: string, value: unknown): void | ((v: unknown) => void);
  call?(c: LiveComponent, call: Call): void | { earlyReturn: unknown };
  render?(c: LiveComponent, ctx: RequestContext): void | (() => void);
  dehydrate?(c: LiveComponent, ctx: RequestContext): void;
  exception?(c: LiveComponent, e: unknown): void;
}
```

A `FeatureBus` iterates registered features per phase, collecting post-callbacks
(the "finisher" pattern). Decorators register metadata that features read — e.g.
`@locked` writes to a metadata set that `LockedFeature.update()` enforces.

**v1 feature set (essential):** lifecycle, events, magic actions, locked,
computed, validation, nesting. Everything else is opt-in later.

### 2.5 Security (kept from Livewire, made explicit)
- **HMAC checksum** over snapshot (minus `memo.children`), constant-time compare.
- **Method gating**: only own-prototype public methods; `_`/`$` blocked; reserved
  names blocked; optional `@action`/allowlist.
- **Mass-assignment**: only declared `@prop`s are writable; `@locked` rejects;
  validation runs on update.
- **Synth allowlist** for class hydration. Rate-limit checksum failures.
- **CSRF token** validated in transport layer.

---

## 3. Client architecture (no Alpine required)

### 3.1 Tiny reactivity (client/reactivity/)
~150 lines of signals: `reactive(obj)`, `effect(fn)`, `computed(fn)`. Replaces
`Alpine.reactive/effect/watch`. An **Alpine adapter** can delegate to Alpine if the
host page already uses it (opt-in), so we interoperate without depending.

### 3.2 Component & `$wire` (client/component.ts, wire.ts)
Three state layers (as Livewire): `canonical` (last server state), `ephemeral`
(live mutable), `reactive` (signal-wrapped ephemeral). `$wire` is a typed `Proxy`:
`$get/$set/$call/$watch/$dispatch/$refresh/$upload/$parent`, property access
proxied, unknown keys → `fireAction`.

### 3.3 Request batching (client/request/)
Mirror Livewire's proven model: action → `Message` (per component) → 5ms buffer →
pooled `Request` (many components, one round-trip) → transport → apply effects in
a transaction (sync → effects → morph → render). Fingerprint+squash duplicate
actions. Queue non-parallel actions; allow parallel `wire:model.live`.

### 3.4 DOM morph (client/morph.ts)
Standalone morph (port of a small morphdom-style diff) keyed by `wire:id` >
`wire:key` > `id`. Preserves focus, child components, `wire:ignore`. No Alpine.

### 3.5 Directives (client/directives/)
`wire:click|submit|change` (→action), `wire:model[.live|.blur|.debounce]`
(two-way), `wire:loading[.delay]`, `wire:poll`, `wire:dirty`, `wire:init`,
`wire:ignore`, `wire:stream`, `wire:navigate`. Pluggable registry like Livewire's
`directive(name, cb)`.

### 3.6 Interceptors
Client hook bus (`onSend/onSuccess/onError/onMorph/...`) so loading/streaming/
redirects/uploads are *features*, not core.

---

## 4. Transport (the big upgrade)

```ts
interface Transport {
  send(req: UpdateRequest): Promise<UpdateResponse>;   // request/response
  subscribe?(channel: string, cb: (msg: ServerPush) => void): () => void; // push
}
```

- **HttpTransport** — `POST /_live`, batched, AbortController, streaming via
  chunked NDJSON (`{stream:true,...}`) for progressive `wire:stream`.
- **SseTransport** — request over POST, **server push** over an `EventSource`
  channel: enables `broadcast()` to all mounted instances (live dashboards,
  notifications) — something Livewire can't do natively.
- **WebSocketTransport** — duplex; lowest latency; same protocol frames.

Server side, a `Broadcaster` lets a component push effects to subscribers:
`this.broadcastTo("room:42", { dispatches: [...] })`. SSE/WS deliver it; HTTP
clients fall back to `wire:poll`.

Framework adapters (express/elysia/koa/fivem) only translate native req/res into
`UpdateRequest`/`UpdateResponse` — thin glue.

---

## 5. Kire integration (uses the seams found in core)

- **Mount directive / element**: `@live("counter", { userId })` and
  `<live:counter :user-id="id" />`. Codegen (via `CompilerApi.write/append/depend`)
  emits the SSR wrapper:
  `<div wire:id="…" wire:name="counter" wire:snapshot='…'>…rendered…</div>`.
  Uses `api.depend()` to compile the component's view as a Kire dependency and
  `api.uid()` for ids; `markAsync()` since mount may await data.
- **Per-request isolation**: each request uses `kire.fork()`; component state,
  event queues, and the `Store` live on the fork (via `onFork`).
- **Client runtime injection**: `@liveScripts` (or auto via `existVar`) injects the
  browser bundle `<script>` once — same mechanism as `@push/@stack` in `layout.ts`.
- **Async**: component `render()` returns a Promise; Kire's async dep path
  (`dep.meta.async` → `await`) already supports it.

---

## 6. Build & packaging
- Server core: ESM/CJS via the existing `tools/build.ts` flow.
- Client: separate browser bundle (esbuild), validated for zero Node imports
  (same guard core uses). Served at a stable URL or inlined.
- Tests: server pipeline unit tests + a JSDOM client test + Playwright e2e
  (reuse `tools/playwright.ts`).

---

## Implementation status

Built in `packages/wire` (in-place rewrite), **54 wire tests passing**
(160 incl. core), strict typecheck clean, server + Node-free client bundles build:

- ✅ **Phase 1** — protocol (`contracts.ts`), synthesizers + registry + builtins,
  HMAC checksum, snapshot (de)hydrate, store, context, deep properties, pipeline.
- ✅ **Phase 2** — `@Component/@prop/@locked/@computed/@renderless/@on/@validate/@action`
  decorators; `Feature`/`FeatureBus`; lifecycle, locked, validation, magic features;
  `$dispatch`/`$broadcast`.
- ✅ **Phase 3** — Kire plugin: `@wire` directive, `<wire:*>`/`<kirewire:*>`/`<livewire:*>`
  elements, `@kirewireScripts`, root `wire:*` attribute injection.
- ✅ **Phase 4** — client: signal reactivity, `$wire` proxy + evaluator, standalone
  morph, 5ms-buffered pooled requests, directives (`wire:click/submit/model/init/poll/loading`),
  bootstrap. End-to-end (JSDOM) click→action→morph and `wire:model` verified.
- ✅ **Phase 5** — transports: `HttpTransport`, `SseTransport`, `WebSocketTransport`
  (client) + `Hub` broadcaster, `handleUpdate`/`nodeHttpAdapter`, `serveSse`,
  `serveWs` (server). `broadcastTo`/push verified in-process.
- ✅ **Phase 6** — `@lazy`, `@url`; `WireForm` (validate/reset); `paginate()`;
  file uploads (`WireFile`, `MemoryFileStore`, `FileUploadSynth`/`Feature`,
  `handleUpload`, client `$upload` + file-input `wire:model`); `modelSynth`/
  `defineSynth` class serialization; `$entangle`; `wire:confirm`; framework
  adapters (`createFetchHandler` Web-standard, `expressAdapter`); build script
  (server ESM/CJS + Node-free browser client). Optional Alpine adapter left as a
  thin future shim.

---

## 7. Phased roadmap (with confirmed decisions)

Because SSE/WS are first-class, the protocol carries push frames from Phase 1 and
the `Transport`/`Broadcaster` interface is defined early; concrete WS/SSE land with
the client.

**Phase 1 — protocol + server core (no client yet)**
`contracts.ts` incl. **`ServerPush`/broadcast frames**, snapshot, checksum, synth
(primitives + Date/Map/Set/array/object), pipeline
(hydrate→update→call→render→dehydrate), registry, RequestContext, store,
`Transport`/`Broadcaster` interfaces. Unit-tested against hand-written request JSON.

**Phase 2 — class ergonomics + features**
Component base, decorators (`@Component/@prop/@locked/@computed/@on/@renderless`),
FeatureBus, features: lifecycle, magic, locked, events, computed, validation,
nesting, **broadcast** (`this.broadcastTo(channel, effects)`).

**Phase 3 — Kire integration (SSR)**
`@wire`/`<wire:*>` directive + element codegen, fork wiring, client script
injection. Output renders correct `wire:*` HTML.

**Phase 4 — client runtime + signals**
own signal reactivity, client component/$wire, standalone morph, request batching,
core directives. End-to-end click→action→morph works over the transport layer.

**Phase 5 — transports (primary path)**
**WebSocket + SSE transports and the Broadcaster delivery** (live push,
`wire:stream`, notifications), plus a plain **HTTP fallback** and `wire:poll` for
non-push clients. Redirects, loading, dirty.

**Phase 6 — v1.1 features**
file uploads, form objects, lazy loading, pagination, model/ORM synth, entangle,
query-string/url, optional Alpine adapter.

---

## 8. Decisions — resolved
1. **Reactivity:** own signals; Alpine optional adapter (Phase 6).
2. **Transport:** SSE + WebSocket first-class from v1; HTTP/poll fallback.
3. **Package:** in-place rewrite of `packages/wire`, name kept.
