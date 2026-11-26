# CLAUDE.md — Kire

> This file is the canonical source of truth for how the Kire monorepo is laid out and how its
> pieces fit together. Other agent guides (e.g. `GEMINI.md`) defer to it. Keep it in sync with the
> code — if you restructure a package, update the relevant table here in the same change.

## Project

Kire is a compile-to-JavaScript template engine inspired by Laravel Blade. Templates compile to optimized JS functions. Kirewire (`packages/wire`) adds server-driven reactive components (like Livewire).

**Monorepo layout:**
```
core/            → core engine (lexer, compiler, runtime, directives, elements)
packages/
  wire/          → Kirewire: server-driven reactive components (server + client)
  vite/          → Vite plugin for Kire (.kire files, HMR, Laravel-style @vite manifest)
  assets/        → asset management plugin
  auth/          → authentication directives
  iconify/       → Iconify icon integration
  markdown/      → Markdown rendering plugin
  tailwind/      → Tailwind integration
  utils/         → Laravel-like template helpers (Str, Arr, Html, Route, MessageBag)
  i18n/          → localization plugin (@lang, @choice, __())
  express/       → Express integration (view engine + res.view + Kirewire setup)
  fastify/       → Fastify integration (reply.view + Kirewire setup)
  elysia/        → Elysia integration (context.view + Kirewire setup)
  koa/           → Koa integration (ctx.view + Kirewire setup)
  hono/          → Hono integration (c.var.view + Kirewire setup)
  h3/            → h3 (unjs) integration (view()/middleware + Kirewire setup)
  fivem/         → FiveM NUI integration (render + RegisterNuiCallback handler)
  create-kire/   → `npm create kire` scaffolding CLI + templates
benchmark/       → engine benchmarks
docs/            → documentation site (built with Kire + Kirewire); content in docs/resources/content
vs-kire/         → VS Code extension
tools/           → build, publish, benchmark, llms & install scripts
```

**Package manager:** Bun
**Linter/formatter:** Biome (tabs, strict TS)
**Module:** ESNext, bundler resolution
**Published scope:** `@kirejs/*` (core is the bare `kire` package)

---

## Commands

```bash
bun test                          # all unit tests (Bun test runner)
bun test core/tests               # core tests only
bun test packages/wire/tests      # wire tests only
bun run tools/playwright.ts       # E2E browser tests
bun run tools/build.ts            # build all packages → publish/
bun run tools/publish.ts          # publish packages
bun run tools/llms.ts  (bun llms) # regenerate llms.txt context files
bun run check                     # Biome check across the workspace
```

> Note: `packages/wire/tests/client.test.ts` requires `jsdom` (declared in `packages/wire/package.json`).
> Run `bun install` if that test errors with "Cannot find package 'jsdom'".

---

## Core Architecture

### Data Flow

```
kire.render(template, locals)
  → Lexer.parse(template)       → AST nodes
  → Compiler.compile(nodes)     → JS code string
  → KireTplFunction (wrapped)   → execute with locals → HTML string
```

Templates are cached by filepath after first compile.

### Key Files (`core/src/`)

| Path | Purpose |
|---|---|
| `kire.ts` | Main `Kire` class — config, plugin loading, `parse`, `compile`, `render`, `view`, `fork`, cache |
| `lexer/` | Tokenizer → AST. `lexer.ts` (main), `cursor.ts` (scanning), `balance.ts` (bracket/brace balancing) |
| `compiler/` | AST → JS code string. `compiler.ts` (main), `attr-codegen.ts` (attribute codegen), `js-scanner.ts` (string/comment stripping + `await` detection) |
| `runtime.ts` | `createKireFunction()` — wraps compiled function with metadata |
| `types.ts` | All type definitions |
| `public.ts` | Shared public export surface (Node + Browser) |
| `browser.ts` | Browser entrypoint |
| `type-declare.ts` | Registers built-in type metadata for tooling |
| `directives/` | Native directives, grouped (see below) |
| `elements/natives.ts` | Native elements (`<style>`, `<script>`, `<kire:*>`) |
| `utils/` | HTML escaping, path resolution, source maps, errors, attributes, regex, registry, scoped vars, base64, node helpers |

### Directives (`core/src/directives/`)

Registered by the `KireDirectives` plugin (`directives/index.ts`, `name: "@kirejs/core"`):

| File | Directives |
|---|---|
| `layout.ts` | `@define`, `@defined`, `@stack`, `@push`, `@prepend`, `@pushOnce`, `@prependOnce` |
| `natives/if.ts` | `@if`, `@elseif`, `@else`, `@unless` |
| `natives/checks.ts` | `@isset`, `@empty` |
| `natives/loop.ts` | `@for`, `@each`, `@foreach` (Blade `as` syntax + `key => value`), `@forelse`, `@while`, `@break`, `@continue` (exposes `$loop`, `index`) |
| `natives/switch.ts` | `@switch`, `@case`, `@default` |
| `natives/attributes.ts` | `@attr`, `@attrs`, `@class`, `@style`, plus boolean helpers `@checked`, `@selected`, `@disabled`, `@readonly`, `@required` |
| `natives/misc.ts` | `@once`, `@error`, `@csrf`, `@method`, `@const`, `@let`, `@interface` (type-only, for tooling) |
| `natives/blade.ts` | `@json`, `@dump`, `@dd`, `@env`, `@production`, `@inject` (from `$globals.services`), `@session` (from `$globals.session`, exposes `$value`) |
| `import.ts` | `@include`, `@includeIf`, `@includeWhen`, `@includeUnless`, `@includeFirst` |
| `component.ts` | `@component`, `@slot`, `@yield`, `@section`, `@show`, `@layout`, `@extends` |
| `props.ts` | `@props` (declare props + defaults, rest flow into `$attributes`), `@aware` (inherit props from parent scope); registers the `$attributes` bag provider |

Echo: `{{ expr }}` (escaped), `{{{ expr }}}` / `{!! expr !!}` (raw, unescaped), `@{{ … }}` / `@{!! … !!}` (literal), `{{-- … --}}` (comment). `@verbatim … @endverbatim` emits its body literally (lexer-level, no inner processing).

`elements/natives.ts` registers element forms: raw `<style>` / `<script>`, the control-flow `<kire:*>` elements (`kire:if`, `kire:elseif`, `kire:else`, `kire:for`, `kire:empty`, `kire:switch`, `kire:case`, `kire:default`), and `<kire:*>` aliases for the directives above (e.g. `kire:include`, `kire:component`, `kire:layout`, `kire:extends`, `kire:slot`, `kire:section`, `kire:yield`, `kire:define`, `kire:stack`, `kire:push`, `kire:unless`, `kire:isset`).

### Kire Class Conventions

- **Private storage:** `~` prefix (e.g., `~elements`, `~directives`, `~cache`, `~store`)
- **Public getters:** `$` prefix (e.g., `$elements`, `$directives`, `$cache`, `$config`, `$globals`)
- **NullProtoObj:** Used for hash maps to avoid prototype pollution
- **`fork()`:** Creates request-scoped copy; shares cache/config, isolates globals/props

### Key Types

```ts
KireOptions<Async>      // Constructor config: root, extension, async, platform, production
KireConfig              // Normalized config
KirePlatform            // Filesystem/env abstraction (Node/Browser agnostic)
KireTplFunction         // Compiled template fn with path, code, async, dependencies metadata
KireCacheEntry          // Cached state: AST, compiled fn, source, dependencies
CompilerApi             // API passed to directive/element handlers (write, append, renderChildren, uid, getAttribute, ...)
Node                    // AST node union: text | interpolation | directive | element | comment
DirectiveDefinition     // name, onCall handler, schema metadata (signature, examples, declares)
ElementDefinition       // same as directive but for elements; raw flag for unescaped content
KirePlugin<Options>     // { name, sort, load(kire, opts) }
KireSchemaObject        // VS Code intellisense metadata
```

### Plugin / Extension API

```ts
kire.plugin(MyPlugin)                  // load plugin
kire.directive({ name, onCall, ... }) // register directive
kire.element({ name, onCall, ... })   // register element
kire.attribute({ name, type, ... })   // schema-only attribute
kire.$global(name, value)              // global variable for all templates
kire.type({ variable, type, tstype }) // type metadata for tooling
kire.existVar(pattern, callback)       // variable detection hook
kire.onFork(callback)                  // fork lifecycle hook
```

### Async Detection

`compiler/js-scanner.ts` strips string literals and comments before scanning for the `await` keyword — prevents false positives from `await` in template text.

---

## packages/wire (Kirewire)

Server-driven reactive components. The server holds state; the client applies DOM updates over HTTP/SSE/WebSocket.

### Data Flow

```
Browser: wire:click → POST /_kirewire (snapshot + call)
Server: Kirewire pipeline → hydrate component → run action/method → re-render view
Server: response { snapshot, html, effects } → Browser
Browser: morph DOM, run effects, sync wire:model values
```

### Key Files (`packages/wire/src/`)

| Path | Purpose |
|---|---|
| `kirewire.ts` | `Kirewire` orchestrator — registers components, wires transports |
| `component.ts` | `LiveComponent` base class — `view()`, `render()`, `$dispatch*`, public-state serialization |
| `decorators.ts` | Class/member decorators: `@Component`, `@prop`, `@locked`, `@computed`, `@renderless`, `@on`, `@validate`, `@action`, `@lazy`, `@url` |
| `metadata.ts` | Reflection helpers (`resolveMeta`, `ownMeta`), `ComponentMeta` |
| `contracts.ts` | Wire-protocol contracts (snapshots, effects, action requests) |
| `registry.ts` | `ComponentRegistry` — name → component class |
| `kire/plugin.ts` | `kirewirePlugin` — registers `@wire`, `<wire:*>`/`<kirewire:*>`/`<livewire:*>`, `@kirewireScripts` |
| `adapters/` | Framework adapters: `express.ts`, `fetch.ts` (Web Fetch) |
| `server/` | Transports & request handling: `http.ts`, `sse.ts`, `ws.ts`, `fivem.ts`, `hub.ts` |
| `client/` | Browser runtime: `wire.ts`, `component.ts`, `reactivity.ts`, `morph.ts`, `navigate.ts`, `transport.ts`, `directives.ts`, `data.ts`, `runtime.ts` |
| `runtime/` | Server runtime: `context.ts` (RequestContext), `snapshot.ts` (hydrate/dehydrate), `properties.ts` (`getDeep`/`setDeep`), `checksum.ts` (`sign`/`verify`), `store.ts` |
| `synth/` | Property (de)hydration synths: `synth.ts`, `class.ts`, `registry.ts`, `builtins.ts` |
| `features/` | `file-upload.ts`, `form.ts`, `validation.ts`, `pagination.ts`, `lazy.ts`, `lifecycle.ts`, `locked.ts`, `magic.ts`, `url.ts`, `feature.ts` |

### Component API

```ts
@Component("counter")
class Counter extends LiveComponent {
  // public props are reactive state; public methods are callable actions
  count = 0;

  @computed get double() { return this.count * 2; }

  increment() { this.count++; }
}
```

```ts
abstract class LiveComponent {
  $id: string;                 // unique instance id (set by runtime)
  $name: string;               // registered component name
  $kire?: Kire;                // request-scoped engine (a fork)
  $context?: RequestContext;   // active request context
  render(): string | Promise<string>;              // default renders view($name)
  view(path, extra?): string | Promise<string>;    // render a Kire view with this scope
  $dispatch(event, ...params): void;                // queue a client event
  $dispatchTo(name, event, ...params): void;        // target a component by name
  $dispatchSelf(event, ...params): void;            // back to this component
}
```

> Reserved (never callable as actions): `constructor`, `render`, `view`, `mount`, `boot`, `booted`,
> `getPublicState`, `hydrated`, `dehydrating`, plus any `$`/`_`-prefixed member.

### Wire Client Directives

`wire:click`, `wire:submit`, `wire:change`, `wire:keydown`, `wire:model` (and `wire:model.live/.blur/.lazy`), `wire:poll`, `wire:loading`, `wire:init`, `wire:confirm`, `wire:snapshot`, `wire:dirty` (+ `wire:target`, `.class`/`.remove` modifiers), `wire:offline`, `wire:ignore`, `wire:key`, `wire:navigate`.

> Not yet ported from Livewire: `wire:transition`, `wire:stream`, `wire:replace` (these touch the morph/transport core and need dedicated E2E work).

### Wire Kire Directives/Elements

- `@wire(name, locals?)` — mount a component (directive)
- `<wire:*>`, `<kirewire:*>`, `<livewire:*>` — mount a component (element, `void`)
- `@kirewireScripts` — inject the client runtime script (default `/kirewire.js`)

---

## Other packages

| Package | Purpose | Notable src |
|---|---|---|
| `packages/vite` | Vite plugin for `.kire` files (transform, HMR) + Laravel-style manifest & `@vite` helper | `plugin.ts`, `kire-plugin.ts`, `manifest.ts` |
| `packages/assets` | Asset management plugin (dev server + manifest) | `plugin.ts`, `server.ts` |
| `packages/auth` | Authentication directives | `plugin.ts` |
| `packages/iconify` | Iconify icon integration | `plugin.ts`, `api.ts` |
| `packages/markdown` | Markdown rendering plugin | `index.ts` |
| `packages/tailwind` | Tailwind integration (compile/runtime/loader) | `compiler.ts`, `runtime.ts`, `loader.ts` |
| `packages/utils` | Laravel-like template helpers | `Str.ts`, `Arr.ts`, `Html.ts`, `Route.ts`, `MessageBag.ts` |
| `packages/i18n` | Localization: `@lang`, `@choice`, `__()`/`trans()`/`trans_choice()` with placeholders & Laravel-style pluralization | `plugin.ts`, `translator.ts` |
| `packages/express` | Express integration: `kireExpress(opts)` middleware or `kireExpress(app, opts)` — Kire as view engine + typed `res.view(dotted, data)` | `index.ts`, `engine.ts` |
| `packages/fastify` | Fastify integration: `kireFastify(opts)` plugin or `kireFastify(app, opts)` — typed `reply.view(dotted, data)` | `index.ts` |
| `packages/elysia` | Elysia integration: `kireElysia(opts)` plugin — context `view(dotted, data)` + `kire` | `index.ts` |
| `packages/koa` | Koa integration: `kireKoa(opts)` middleware — `ctx.view(dotted, data)` | `index.ts` |
| `packages/hono` | Hono integration: `kireHono(opts)` middleware — `c.var.view(dotted, data)` | `index.ts` |
| `packages/h3` | h3 (unjs) integration: `kireH3(opts)` → `{ view, middleware }` | `index.ts` |
| `packages/fivem` | FiveM NUI integration: `kireFivem(opts)` → `{ engine, render, handler, broadcaster }`; wraps `createFiveMHandler`/`FiveMBroadcaster` | `index.ts` |
| `packages/create-kire` | `npm create kire` CLI (@clack/prompts): scaffolds a framework template in TS or JS from `templates/<id>/{meta.json,shared,ts,js}` | `src/index.ts` |

Integration packages (express/fastify/elysia/koa/hono/h3) each support two call styles where idiomatic and a typed `view` helper; `wire: { instance }` mounts Kirewire + auto-serves the client. `fivem` is NUI-based (no HTTP). Alpine.js interop: unknown `@attrs` pass through, and `start({ alpine })` re-runs `Alpine.initTree` after each morph.

Integration packages share a shape: `{ views, extension?, production?, engine?, plugins?, globals?, wire? }`.
- Express/Fastify each accept two call styles: `(options)` returning a middleware/plugin (`app.use(...)` / `app.register(...)`), or `(app, options)` returning the engine. Both add a **typed** `res.view`/`reply.view` (module augmentation on `Express.Response` / `FastifyReply`); Elysia infers `view` on its context.
- `wire: { instance, path?, scriptUrl?, clientScript?, store? }` requires `@kirejs/wire` (optional peer): it loads `kirewirePlugin`, mounts the update endpoint, and auto-serves the client runtime (resolved from `@kirejs/wire/client`, or `clientScript`).

---

## Build

`tools/build.ts` flow, per package:
1. Clean stray outputs.
2. `tsc --emitDeclarationOnly` → `dist/types`.
3. `bun build src/index.ts` → `dist/esm` (ESM) and `dist/cjs` (CJS), each with its own `package.json` `type`, into `publish/<pkg>/`.
4. Packages with a `prebuild` script get their `dist` copied into `publish/`.

---

## Testing

- Unit tests: `bun test` (Bun's built-in test runner)
- E2E: `bun run tools/playwright.ts`
- Core tests in `core/tests/`
- Wire tests in `packages/wire/tests/`

---

## Debugging Methodology

Before changing any compiler code, verify assumptions at each layer. Never skip steps.

### Step 1 — Inspect the AST (parser)

```ts
import { Kire } from "./core/src/kire";
const k = new Kire();
const nodes = k.parse(`your template here`);
console.log(JSON.stringify(nodes, null, 2));
```

Verify the AST node types, attributes, and children are what you expect. If the AST is wrong, the bug is in the lexer. If the AST is correct, continue.

### Step 2 — Inspect compiled code (compiler)

```ts
import { Kire } from "./core/src/kire";
const k = new Kire();
const entry = k.compile(`your template here`, "debug.kire");
console.log(entry.code);
```

Read the generated JS. Check:
- Are all identifier declarations (`let x = $props['x'] ?? $globals['x']`) present?
- Does the dep function (`_dep0`) have its own `const $escape = this.$escape` if it uses interpolations in attributes?
- Are template-literal expressions correctly generated?

If the compiled code is wrong, the bug is in `compiler/`. Fix only that.

### Step 3 — Write a targeted test

Only after steps 1–2 confirm the root cause, add a test to `core/tests/` that reproduces the exact failure. Run with:

```bash
bun test core/tests/<file>.test.ts
```

Do not write speculative code changes. Do not implement fixes before understanding the AST and compiled output.

---

## Non-Obvious Patterns

1. **Fork isolation:** `kire.fork()` for per-request context; safe to share parent cache.
2. **Proxy `$files`:** Virtual filesystem via Proxy; checks parent fork → cache → disk.
3. **Fast element matcher:** All element names compiled into a single regex via `createFastMatcher()`.
4. **`isDependency` / `scope` hooks:** Directives declare variables they introduce → powers VS Code intellisense.
5. **Metadata-driven tooling:** Every directive/element carries schema metadata → no separate docs system needed.
6. **`~` private / `$` public convention:** Consistent across `kire.ts` — never access `~` fields from outside the class.
7. **Wire serialization boundary:** On `LiveComponent`, public non-prefixed properties are reactive state; `$`/`_`-prefixed members are framework-internal and never serialized or exposed as actions.
8. **Wire synths:** Non-primitive component state is (de)hydrated through the `synth/` registry rather than raw JSON.
