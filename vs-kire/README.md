# KIRE IntelliSense

Language support for the Kire templating engine in Visual Studio Code.

## Features

- Syntax highlighting for `.kire` and `.kire.html`
- Schema-driven completions for directives, elements and attributes
- Hover documentation fed by Kire core and installed `kire.schema.js` packages
- Type-aware completions and hover for `{{ ... }}`, JS-like attributes and `<?js ?>`
- `@interface(...)` support for local and workspace-wide template typing
- Diagnostics for directive blocks, HTML structure, interpolations and typed attributes
- Formatting, folding, document symbols and auto-closing tags

## Schema Loading

The extension scans the workspace for `kire.schema.js` files and merges:

- package metadata such as name, version and repository
- directives, elements and attributes
- globals and types
- tooling metadata exposed by packages

Use `Kire: Reload Schemas` after changing plugin schemas or installing a new Kire package.

## Typing

The extension understands modern Kire typing patterns, including:

```kire
@interface(App.ViewModel)

@interface({
  user: App.User,
  settings: Partial<App.Settings>
}, true)

@const(title = "Dashboard")

<div>{{ user.name }}</div>
```

- `@interface(Type)` enriches the current file
- `@interface({...}, true)` contributes workspace-global typing
- `@const` and `@let` declarations are surfaced to editor tooling

## Commands

- `Kire: Reload Schemas`
- `Kire: Show Logs`

## Settings

- `kire.logs.debug`: enable verbose logs in the Kire output channel
- `kire.schema.scanNodeModules`: scan `node_modules` for `kire.schema.js`

## Development

```sh
bun install
bun run check
bun run test
bun run bundle
```

To build a VSIX:

```sh
bun run build
```
