---
route: "/docs/kire/how-kire-works"
title: "How Kire Works"
description: "Understand Kire parser/compiler/runtime internals, cache behavior, dependency resolution, and request isolation."
tags: ["compiler", "cache", "runtime", "execution", "performance", "internals"]
section: "Kire Internals"
order: 1
---

# How Kire Works

Kire compiles templates into JavaScript functions. That is why it stays fast after the first render.

## End-to-end pipeline

1. `view("pages.home")` resolves to a template path
2. the lexer parses the source into nodes
3. the compiler turns nodes into JavaScript
4. Kire wraps that JavaScript in a callable function
5. the function runs with locals, globals and the engine context
6. the rendered HTML string is returned

```text
Template -> Lexer(AST) -> Compiler(JS) -> Template Function -> HTML
```

## Path resolution

`view()` calls go through Kire path resolution first.

Inputs that affect it:

- `root`
- `extension`
- `namespace(name, path)`
- `files` when you use an in-memory or browser setup

That is why the same API works on disk-backed projects and on `kire/browser`.

## Lexer stage

The lexer recognizes:

- plain text
- interpolations like `{{ ... }}` and `{{{ ... }}}`
- directives like `@if`, `@for`, `@layout`
- elements like `x-card`, `kire:if`, `wire:chat`
- inline JS blocks when enabled by the syntax

It also tracks line and column metadata so runtime errors can point back to the original template.

## Compiler stage

The compiler:

- walks the parsed nodes
- asks registered directives and elements to emit JavaScript
- records dependencies from things like `@include`, `@component` and `x-*`
- tracks whether async work is required
- generates the final function body

Directives and elements are not hardcoded in the compiler. They are registered definitions that write JS through the compiler API.

## Runtime stage

At runtime, the compiled function receives:

- `$props`
- `$globals`
- `$kire`
- `$kire_response`
- `$escape`

The output is built into `$kire_response` and returned at the end of the execution.

## Caching

Kire maintains two relevant caches:

### Inline render cache

Used by `render(templateString)`.

The `max_renders` option controls how many inline templates stay cached.

### File cache

Used by `view(path)`.

In production mode, Kire trusts the compiled function cache more aggressively. In development mode, file-backed templates check modification time before reuse.

## Dependency graph

Kire tracks dependencies from:

- `@include`
- `@component`
- `@layout`
- `@extends`
- `x-*`

That lets it compile nested templates in the right order and detect circular references.

## Unknown directives

By default, unknown directives are preserved as text. That is useful when you are gradually building a custom dialect or mixing content.

If you want hard failures on typos:

```ts
const kire = new Kire({
  strict_directives: true,
});
```

## Request isolation

The base engine instance should usually be configured once at startup:

```ts
const kire = new Kire({ root: "./views" });
```

Then fork per request when you inject request-scoped globals:

```ts
const viewKire = kire.fork();
viewKire.$global("requestId", req.id);
viewKire.$global("user", req.user);
```

That keeps request state isolated without rebuilding the engine definitions every time.

## Browser mode

`kire/browser` swaps the default platform so filesystem operations resolve against virtual files instead of Node APIs.

That is how the docs playground can run the same engine core directly in the browser.

## Error mapping

Kire wraps runtime failures in `KireError` and keeps enough metadata to show the original template path and line context.

That is especially important when the generated JavaScript fails deep inside nested templates.

## Performance guidelines

- keep heavy business logic out of templates
- register plugins and namespaces once
- prefer `view()` for stable file-based templates
- use `render()` for small dynamic fragments and test cases
- turn on `production: true` in real deployments

## Related pages

- [Getting Started](/docs/kire/getting-started)
- [Creating Plugins](/docs/kire/creating-plugins)
- [Browser Runtime and Playground](/docs/kire/browser-playground)
