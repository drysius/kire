# kire (core)

`kire` is the base template engine package.

## Purpose

- Compile templates to JavaScript functions.
- Render views with locals and globals.
- Provide extensibility via directives and elements.

## Main APIs

- `new Kire(options)`
- `kire.render(template, locals)`
- `kire.view("namespace.file", locals)`
- `kire.namespace(name, rootPath)`
- `kire.plugin(plugin)`
- `kire.fork()`

## Typical Use

Use this package directly in backend apps, then add optional plugins (`wire`, `markdown`, `utils`, etc.) based on your needs.

## Best Fit

- SSR apps
- email template systems
- backend HTML rendering
- hybrid server-driven interfaces
