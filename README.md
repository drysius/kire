# Kire

Kire is a template engine for JavaScript and TypeScript that compiles template text directly into optimized JavaScript functions. It borrows the ergonomics of Blade-style directives, adds custom elements and plugins, and keeps the runtime open enough to power full server rendering, package-level extensions, and reactive layers such as Kirewire.

## What Is In This Repo

| Path | Purpose |
| --- | --- |
| `core/` | The `kire` package: parser, compiler, runtime, native directives, native elements, and type metadata. |
| `vs-kire/` | `KIRE IntelliSense`, the VS Code extension for highlighting, hover docs, completions, diagnostics, semantic coloring, and schema loading. |
| `packages/assets/` | Asset capture helpers such as `@assets`, `@svg`, inline `<style>`, and inline `<script>`. |
| `packages/auth/` | Auth-aware directives such as `@auth`, `@guest`, `@can`, and `@user`. |
| `packages/iconify/` | Iconify integration with `@icon(...)` and `<iconify ... />`. |
| `packages/markdown/` | Markdown rendering helpers such as `@markdown(...)` and `@mdslots(...)`. |
| `packages/tailwind/` | Tailwind CSS compilation from `@tailwind` and `<tailwind>...</tailwind>`. |
| `packages/utils/` | Laravel-style helpers such as `Route`, `Html`, `Str`, `Arr`, `@error`, and `@old`. |
| `packages/vite/` | Vite integration with Laravel-style `@vite(...)` support. |
| `packages/wire/` | Kirewire: reactive components, `@wire(...)`, `@kirewire()`, and `wire:*` attributes. |

## Core Features

- JIT compilation to JavaScript functions.
- Blade-like directives such as `@if`, `@for`, `@switch`, `@define`, `@slot`, and `@component`.
- Native logic elements such as `<kire:if>`, `<kire:for>`, and `<kire:switch>`.
- Extensible directives, elements, attributes, globals, and custom types through plugins.
- Per-request isolation with `fork()`.
- Source-aware errors and editor-friendly metadata.

## Quick Start

```ts
import { Kire } from "kire";

const kire = new Kire({
	root: "views",
});

const html = await kire.render(
	`
		@if(user)
			<h1>Hello {{ user.name }}</h1>
		@else
			<h1>Hello guest</h1>
		@end
	`,
	{ user: { name: "Kire" } },
);

console.log(html);
```

## VS Code Extension

The recommended editor companion is `KIRE IntelliSense`:

- Marketplace: <https://marketplace.visualstudio.com/items?itemName=Kire.kire-intellisense>
- Source: [`vs-kire/`](./vs-kire)

The extension reads metadata from Kire core and workspace schemas such as `kire.schema.js`. That is how directives, elements, attributes, examples, package ownership, and hover documentation show up inside `.kire` files.

## Package Philosophy

Kire keeps the core generic. The engine knows how to parse and compile templates, but package-specific behavior lives in plugins. Packages can register:

- directives
- elements
- attributes
- globals
- types
- schema metadata for tooling

That same metadata is what powers a large part of the experience in `KIRE IntelliSense`.

## AI-Assisted Development

Large parts of this project were developed with AI-assisted workflows, especially:

- Codex (ChatGPT)
- Gemini-CLI (Google Gemini 3)

The repository is still authored and reviewed as a normal codebase, but those tools were heavily used to speed up implementation, refactors, diagnostics, and documentation work.

## License

MIT
