# KIRE IntelliSense

`vs-kire/` is the Visual Studio Code extension for Kire templates.

It provides:

- syntax highlighting for `.kire` and `.kire.html`
- Blade-style interpolation highlighting
- Blade-style Kire comments such as `{{-- ... --}}`
- directive, element, and attribute completions
- hover docs with examples and package ownership
- semantic coloring for Kire directives, Kire elements, and Kire-specific attributes
- HTML hover/completion support inside Kire documents
- diagnostics for directives, schema-driven attributes, HTML structure, and embedded expressions
- document symbols, formatting, auto-closing tags, and schema reload commands

## How It Gets Documentation

The extension loads metadata from:

- Kire core
- workspace packages that expose `kire.schema.js`
- runtime-registered metadata such as directive descriptions, examples, declarations, and types

That metadata is what drives hover text, examples, package labels, and many completion details.

## Commands

- `Kire: Reload Schemas`
- `Kire: Show Logs`

## Settings

- `kire.logs.debug`: enable verbose debug logs in the Kire output channel
- `kire.schema.scanNodeModules`: scan `node_modules` for `kire.schema.js`

## Development

```sh
bun install
bun run check
bun run test
bun run bundle
```

To generate the VSIX:

```sh
bun run build
```

## Related Docs

- Repo overview: [`../README.md`](../README.md)
- Core package: [`../core/README.md`](../core/README.md)

## License

MIT
