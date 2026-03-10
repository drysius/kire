# How Kire Works

Kire has a simple but strict lifecycle:

1. Resolve template source (file, virtual file, namespace, inline string).
2. Compile source into a JavaScript function.
3. Execute function with locals and globals.
4. Return rendered HTML string.

## Compilation Model

Templates are compiled to runtime JS. This keeps rendering fast and allows directives to output code directly.

### Why it is fast

- Parsed templates are cached.
- Generated functions are reused.
- `fork()` reuses compile cache between requests.

## Locals and Globals

- Locals: data passed to `render()` / `view()`.
- Globals: shared values injected with `$global()`.

```ts
kire.$global("appName", "Kire Docs");

await kire.render("<h1>{{ appName }}</h1>");
```

## Error Mapping

When a runtime error happens, Kire maps it back to source template lines.
This is useful when debugging nested includes and directives.

## Async Rendering

Kire supports async directives and expressions. If the compiled template needs `await`, runtime executes async.

## fork() Behavior

`fork()` isolates mutable runtime state:

- globals map
- request-scoped values

while sharing:

- template cache
- plugin registrations
- compiled functions

This is the recommended mode for web frameworks.

## Plugin Pipeline

Most syntax features are provided by plugins:

- directives (`@if`, `@for`, custom directives)
- elements (`<x-*>`, `<kire:if>`, custom elements)
- helpers / globals

Kire core keeps the execution model stable while plugins extend syntax.
