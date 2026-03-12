---
route: "/docs/kire/how-kire-works"
title: "How Kire Works"
description: "Understand Kire parser/compiler/runtime internals, cache behavior, dependency resolution, and request isolation."
tags: ["compiler", "cache", "runtime", "execution", "performance", "internals"]
section: "Kire Internals"
order: 1
---

# How Kire Works

Kire compiles template syntax into JavaScript functions.
That is the core reason repeated renders are fast.

## End-to-End Pipeline

1. Path resolution (`view("pages.home")` -> file path via root/namespaces).
2. Lexer parses template into AST nodes.
3. Compiler generates JavaScript from AST.
4. Runtime wraps generated code into callable template function.
5. Function executes with locals, globals, and engine context.
6. Output string is returned (sync or async).

```text
Template -> Lexer(AST) -> Compiler(JS) -> Function -> Rendered HTML
```

## Lexer Stage

The lexer recognizes:

- text blocks
- interpolation (`{{ }}` and `{{{ }}}`)
- directives (`@if`, `@for`, ...)
- elements (`<x-card>`, `<kire:if>`, etc)
- inline JS blocks (`<?js ... ?>`)

It also tracks line/column metadata to improve stack traces.

## Compiler Stage

The compiler:

- transforms AST nodes into JavaScript statements
- injects directive and element handlers
- tracks dependencies from `@include`/`@component`
- auto-maps identifiers from `$props` and `$globals`
- marks templates as async when `await` is detected

Unknown directives behavior:

- default: kept as plain text
- `strict_directives: true`: compilation fails fast

## Runtime Stage

Generated code runs as a template function with:

- `$props`: local render data
- `$globals`: shared/global values
- `$kire`: template metadata/function context
- `$kire_response`: output buffer

Kire uses `new Function` and `AsyncFunction` intentionally for runtime performance.

## Cache Behavior

Kire has two relevant caches:

- inline template cache for `render(templateString)`
- file cache for `view(path)`

Production mode favors cache reuse.
Development mode checks file timestamps for refresh.

## Dependency Resolution

Directives/elements like `@include`, `@component`, and `x-*` can declare dependencies.
Kire resolves and compiles those dependencies and detects circular references.

## Request Isolation

Use `fork()` per request in web servers.

```ts
const requestKire = kire.fork();
requestKire.$global("requestId", req.id);
requestKire.$global("user", req.user);

const html = await requestKire.view("pages.dashboard", { stats });
```

Forks inherit engine definitions but isolate per-request mutable state.

## Error Mapping

Kire wraps failures as `KireError` and maps runtime errors back to template source lines.
In non-production mode, source maps and line markers improve diagnostics.

## Performance Notes

- Keep templates focused on presentation.
- Pass precomputed data from services/controllers.
- Reuse namespaces and engine instance at startup.
- Avoid expensive dynamic template generation at runtime.
