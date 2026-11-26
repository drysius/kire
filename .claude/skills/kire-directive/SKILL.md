---
name: kire-directive
description: Add a native Kire template directive (@foo) — control flow, output helpers, or attribute helpers that compile to JS. Use when the user asks to add/extend a Kire directive or template-language feature.
---

# Add a Kire directive

Directives compile to JavaScript; always follow the AST → compiled-code → test
methodology in the repository root `CLAUDE.md` before and after changing the
compiler.

## Steps

1. Pick where it lives:
   - `core/src/directives/natives/` — grouped: `if.ts`, `loop.ts`, `checks.ts`,
     `switch.ts`, `attributes.ts`, `misc.ts`, `blade.ts`. Register the group in
     `natives/index.ts`.
   - `core/src/directives/` — `component.ts`, `import.ts`, `layout.ts`, `props.ts`,
     registered in `directives/index.ts`.
   - A new file must be imported and called from the matching `index.ts`.
2. Register with `kire.directive({ name, signature?, children?, closeBy?, relatedTo?,
   declares?, scope?, description, example, onCall })`.
   - `children: true` + `closeBy: ["endfoo", "end"]` for block directives.
   - `declares` + `scope` when the directive introduces variables (loop vars, props) —
     this drives the compiler and the vs-kire intellisense.
3. Implement `onCall(api)` with the `CompilerApi`:
   - `api.write(js)` emits JS (control flow), `api.renderChildren()` renders the body,
     `api.getArgument(i)` / `api.getAttribute(name)` read args, `api.transform(expr)`,
     `api.uid(prefix)` for unique identifiers.
   - For output, append to `$kire_response` or use `api.append(...)`.
4. Add `description` + `example` metadata (surfaced in vs-kire and docs).
5. Add a test in `core/tests/` (model after `blade-parity.test.ts`). Run
   `bun test core/tests`. Then `bunx biome check core/src` (noExplicitAny is off — no
   `biome-ignore` for `any`).

## Example

```ts
kire.directive({
	name: "upper",
	signature: ["expr:any"],
	children: false,
	description: "Uppercases an expression.",
	example: `@upper(name)`,
	onCall: (api) => {
		const expr = api.getArgument(0);
		api.write(`$kire_response += $escape(String(${expr}).toUpperCase());`);
	},
});
```
