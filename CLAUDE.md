# CLAUDE.md — Kire

## Project

Kire is a compile-to-JavaScript template engine inspired by Laravel Blade. Templates compile to optimized JS functions. Kirewire (packages/wire) adds server-driven reactive components (like Livewire).

**Monorepo layout:**
```
core/          → core engine (lexer, compiler, runtime, directives, elements)
packages/
  wire/        → reactive component layer (server + client)
  vite/        → Vite plugin for Kire
benchmark/     → engine benchmarks
docs/          → documentation site (uses Kire itself)
vs-kire/       → VS Code extension
tools/         → build & publish scripts
```

**Package manager:** Bun  
**Linter/formatter:** Biome (tabs, strict TS)  
**Module:** ESNext, bundler resolution

---

## Commands

```bash
bun test                          # all tests
bun test core/tests               # core tests only
bun run tools/playwright.ts       # E2E browser tests
bun run tools/build.ts            # build all packages → publish/
bun run tools/publish.ts          # publish packages
```

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

| File | Purpose |
|---|---|
| `kire.ts` | Main `Kire` class — config, plugin loading, compile, render, fork, cache |
| `lexer.ts` | Tokenizes template text → AST nodes (text, interpolation, directive, element, comment) |
| `compiler.ts` | AST → JS code string; tracks dependencies, async, source maps |
| `runtime.ts` | `createKireFunction()` — wraps compiled function with metadata |
| `types.ts` | All type definitions |
| `public.ts` | Public export surface |
| `directives/` | Native directives (`@if`, `@for`, `@unless`, `@switch`, `@layout`, `@component`, `@import`, etc.) |
| `elements/natives.ts` | Native elements (`<style>`, `<script>`, `<kire:*>`) |
| `utils/` | HTML escaping, path resolution, source maps, error rendering, regex, attributes |

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
kire.on(callback)                      // lifecycle hook
kire.onFork(callback)                  // fork lifecycle hook
```

### Async Detection

`compiler.ts` strips string literals and comments before scanning for `await` keyword — prevents false positives from `await` in template text.

---

## packages/wire (Kirewire)

Server-driven reactive components. Server holds state; client handles DOM updates via HTTP/SSE/WebSocket.

### Data Flow

```
Browser: wire:click → POST /_wire
Server: Kirewire.handleRequest() → Component.method() → re-render view
Server: ComponentState { id, html, effects, revision } → Browser
Browser: morph DOM, run effects, sync wire:model values
```

### Key Files (`packages/wire/src/`)

| File | Purpose |
|---|---|
| `component.ts` | `Component` base class — `view()`, `$set()`, validation, error handling |
| `kirewire.ts` | `Kirewire` orchestrator — components, sessions, routes, adapters |
| `decorators.ts` | `@Wire()` and `@Variable()` class decorators; TypeBox schema support |
| `adapter.ts` | Abstract `Adapter` base for transport (HTTP, SSE, Socket, FiveM) |
| `adapters/` | Framework adapters: Express, Koa, Elysia, FiveM; protocol adapters: HTTP, SSE, Socket |
| `contracts.ts` | `ActionRequest`, `ComponentState`, `EffectPacket`, `AdapterTransport` |
| `event-controller.ts` | High-performance event bus: `on()`, `emit()`, `emitSync()` |
| `metadata.ts` | Reflection helpers, `WireVariableDefinition`, metadata decorators |
| `validation/rule.ts` | Rule-based validation (string rules or TypeBox schemas) |
| `features/file-upload.ts` | `WireUpload`, `WireFile` — multi-file upload with validation |
| `features/wire-broadcast.ts` | Broadcast to multiple component instances |
| `web/kirewire.ts` | Client runtime (Alpine.js integration) |

### Component API

```ts
class MyComponent extends Component {
  // Declare reactive properties with @Variable()
  @Variable() count = 0;

  // Declare component with @Wire()
  // Methods become callable actions from the browser

  async increment() {
    this.count++;
  }
}
```

```ts
class Component {
  $live: boolean;              // client-first mode
  $id: string;                 // unique instance ID
  $kire: Kire;                 // engine reference
  view(view, data): Promise<string>;  // render template
  $set(property, value): void;        // update property (dot notation supported)
}
```

### Wire Client Directives

- `wire:click`, `wire:submit`, `wire:input` — trigger server action
- `wire:model` — two-way data binding
- `wire:loading`, `wire:target` — loading state
- `wire:key` — keyed list items

### Wire Kire Directives/Elements

- `@wire(name, locals?)` — mount component (directive)
- `<wire:*>`, `<kirewire:*>`, `<livewire:*>` — mount component (element)
- `@kirewire()` — inject client runtime script

---

## packages/vite

Vite plugin for Kire. Registered in `packages/vite/src/index.ts`.

Handles `.kire` files: transforms them through the Kire compiler, HMR on template change.

---

## Build

`tools/build.ts` flow:
1. Clean `publish/` and stray `.d.ts` in `src/`
2. For each package: `tsc --emitDeclarationOnly` → `esbuild` (CJS + ESM)
3. Build standalone browser bundle: `core/dist/browser/kire.js` (validates no Node imports)

---

## Testing

- Unit tests: `bun test` (uses Bun's built-in test runner)
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

If the compiled code is wrong, the bug is in `compiler.ts`. Fix only that.

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
3. **Fast element matcher:** All element names compiled into single regex via `createFastMatcher()`.
4. **`isDependency` / `scope` hooks:** Directives declare variables they introduce → powers VS Code intellisense.
5. **Metadata-driven tooling:** Every directive/element carries schema metadata → no separate docs system needed.
6. **`~` private / `$` public convention:** Consistent across `kire.ts` — never access `~` fields from outside class.
