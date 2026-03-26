---
route: "/docs/kire/getting-started"
title: "Getting Started"
description: "Install Kire, configure engine options, render views, and understand the runtime model used in production."
tags: ["kire", "setup", "render", "namespaces", "templates", "configuration"]
section: "Kire Essentials"
order: 1
---

# Getting Started

Kire is a trusted-template engine. It parses `.kire` files, compiles them into JavaScript functions and reuses those compiled functions aggressively.

That gives you two immediate consequences:

- repeated renders are fast
- templates are code, not safe user input

Use Kire for templates you own, version and review.

## Install

```bash
bun add kire
# or
npm install kire
```

## Create an engine

```ts
import { Kire } from "kire";

const kire = new Kire({
  root: "./views",
  production: process.env.NODE_ENV === "production",
  extension: "kire",
  local_variable: "it",
  strict_directives: true,
});
```

## Constructor options

These are the main `Kire` options used in real projects.

### `root`

Base directory used by `view()` resolution.

```ts
const kire = new Kire({ root: "./views" });
```

### `production`

When `true`, Kire favors cache reuse and skips development-time file freshness checks.

```ts
const kire = new Kire({ production: true });
```

### `async`

Kire defaults to async rendering. Keep it that way unless your entire template graph is guaranteed to stay sync.

```ts
const kire = new Kire({ async: true });
```

### `extension`

Template extension without a leading dot. Default is `kire`.

```ts
const kire = new Kire({ extension: "tpl" });
```

### `silent`

Suppresses compile warnings printed by the engine when errors happen before a `KireError` is thrown.

```ts
const kire = new Kire({ silent: true });
```

### `strict_directives`

When enabled, unknown directives stop compilation instead of being preserved as text.

```ts
const kire = new Kire({ strict_directives: true });
```

### `local_variable`

Alias used for locals inside templates. Default is `it`.

```ts
const kire = new Kire({ local_variable: "props" });
```

That means this is valid:

```kire
<h1>{{ props.title }}</h1>
```

### `max_renders`

Controls the inline template cache used by `render(templateString)`.

```ts
const kire = new Kire({ max_renders: 2000 });
```

### `files`

Provides an in-memory file map. This is essential for `kire/browser`, but it is also useful for tests and generated templates.

```ts
const kire = new Kire({
  root: "/",
  files: {
    "/views/home.kire": "<h1>{{ title }}</h1>",
  },
});
```

### `platform`

Override low-level filesystem or path behavior when embedding Kire in another environment.

### `emptykire`

Skips registration of the native directives and elements. Use it only when you are building a custom kernel.

```ts
const kire = new Kire({ emptykire: true });
```

## Register namespaces

Namespaces keep view paths short and predictable.

```ts
kire.namespace("layouts", "./views/layouts");
kire.namespace("components", "./views/components");
kire.namespace("pages", "./views/pages");
```

Then you can render with:

```ts
const html = await kire.view("pages.home", {
  title: "Kire App",
  user: { name: "Ada" },
});
```

## Render APIs

### `view(path, locals)`

Resolves a template path, compiles it if needed and runs it.

```ts
const html = await kire.view("pages.home", { user });
```

### `render(templateString, locals)`

Compiles an inline template string and caches it in the inline-render bucket.

```ts
const html = await kire.render("<h1>{{ title }}</h1>", {
  title: "Hello",
});
```

### `compileAndBuild(directories, outputFile)`

Precompiles a set of templates into a bundle file.

```ts
kire.compileAndBuild(["./views/pages", "./views/components"], "./publish/templates.js");
```

## Locals and globals

Locals come from `view()` and `render()` calls:

```ts
await kire.view("pages.dashboard", {
  user,
  stats,
});
```

Globals are shared context values:

```ts
kire.$global("appName", "Kire");
kire.$global("csrf", "secure-token");
```

Inside templates you can access:

- `it` or your `local_variable` alias
- `$props`
- `$globals`

Example:

```kire
<header>{{ $globals.appName }}</header>
<h1>{{ it.user.name }}</h1>
```

## First working layout and page

`views/layouts/app.kire`

```kire
<html>
  <body>
    <header>{{ $globals.appName }}</header>
    <main>@yield("content")</main>
  </body>
</html>
```

`views/pages/home.kire`

```kire
@layout("layouts.app")
  @slot("content")
    <h1>Hello {{ user.name }}</h1>
  @end
@end
```

Render it:

```ts
const html = await kire.view("pages.home", {
  user: { name: "Ada" },
});
```

## Request isolation with `fork()`

In long-running servers, configure the engine once and fork it per request:

```ts
const requestKire = kire.fork();
requestKire.$global("requestId", req.id);
requestKire.$global("user", req.user);

const html = await requestKire.view("pages.dashboard", { stats });
```

Forks inherit directives, elements, plugins and namespaces, but isolate mutable request-specific globals and props.

## Browser mode

When you want Kire in the browser, import from `kire/browser`:

```ts
import { Kire } from "kire/browser";
```

Then rely on `files` plus `namespace()` instead of the Node filesystem.

See the dedicated page:

- [Browser Runtime and Playground](/docs/kire/browser-playground)

## Recommended project structure

```text
views/
  layouts/
    app.kire
  components/
    navbar.kire
    ui/
      badge.kire
  pages/
    home.kire
    dashboard.kire
```

## Production notes

- enable `production: true`
- register namespaces and plugins once at startup
- keep templates focused on presentation
- pass precomputed values from services/controllers
- prefer `strict_directives: true` to catch typos early

## Documentation code blocks

Inside this docs site, fenced code blocks using `kire` receive Kire-specific highlighting:

````md
```kire
@if(user)
  <p>Hello {{ user.name }}</p>
@end
```
````

## Next steps

- Read [Directives Reference](/docs/kire/directives-reference)
- Continue with [Components and Slots](/docs/kire/components-and-slots)
- Open [Browser Runtime and Playground](/docs/kire/browser-playground)
- Use [Elements Reference](/docs/kire/elements-reference) when you want native `kire:*` and `x-*` details
