---
route: "/docs/kire/getting-started"
title: "Getting Started"
description: "Install Kire, configure engine options, render views, and understand the runtime model used in production."
tags: ["kire", "setup", "render", "namespaces", "templates", "configuration"]
section: "Kire Essentials"
order: 1
---

# Getting Started

Kire is a server-side template engine focused on speed, extensibility, and deterministic output.
It compiles templates into JavaScript functions and caches them for fast repeated rendering.

## Runtime Model

Kire templates are trusted code.

- Template expressions are compiled to JavaScript.
- Directives generate JavaScript during compilation.
- `new Function` and `AsyncFunction` are used intentionally for fast runtime execution.

Use Kire only with templates you control.

## Install

```bash
bun add kire
# or
npm install kire
```

## Create an Engine Instance

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

### Main Options

- `root`: base directory for `view()` resolution.
- `production`: enables aggressive cache reuse.
- `extension`: template extension without leading dot (`kire` by default).
- `async`: async rendering mode (`true` by default).
- `strict_directives`: throws when a directive is unknown.
- `local_variable`: alias for `$props` (default `it`).
- `emptykire`: skip native directives and elements for custom kernels.

## Register Namespaces

Namespaces organize templates by domain.

```ts
kire.namespace("layouts", "./views/layouts");
kire.namespace("components", "./views/components");
kire.namespace("pages", "./views/pages");
```

Then render with short names:

```ts
const html = await kire.view("pages.home", {
  title: "Kire App",
  user: { name: "Ada" },
});
```

## Render APIs

### `view(path, locals)`

Resolves a file by namespace/path and renders it.

```ts
const html = await kire.view("pages.home", { user });
```

### `render(templateString, locals)`

Renders inline template content.

```ts
const html = await kire.render("<h1>{{ title }}</h1>", { title: "Hello" });
```

### Globals

Define shared values available in every render.

```ts
kire.$global("appName", "Kire");
kire.$global("csrf", "secure-token");
```

## First Working Layout and Page

`views/layouts/app.kire`

```kire
<html>
  <body>
    <header>{{ appName }}</header>
    <main>@yield("content")</main>
  </body>
</html>
```

`views/pages/home.kire`

```kire
@layout("layouts.app")
  @slot("content")
    <h1>Hello {{ user.name }}</h1>
  @endslot
@end
```

Render:

```ts
const html = await kire.view("pages.home", { user: { name: "Ada" } });
```

## Request Isolation With `fork()`

In HTTP servers, create a fork per request to isolate globals safely.

```ts
const requestKire = kire.fork();
requestKire.$global("requestId", req.id);
requestKire.$global("user", req.user);

const html = await requestKire.view("pages.dashboard", { stats });
```

## Production Notes

- Enable `production: true` to maximize cache reuse.
- Register namespaces once at startup.
- Keep business logic in services/controllers, not templates.
- Pass precomputed values in locals for predictable rendering.
- Use `strict_directives: true` to catch directive typos early.

## Typical Folder Layout

```text
views/
  layouts/
    app.kire
  components/
    navbar.kire
  pages/
    home.kire
```

## Next Steps

- Read **Directives Reference** for complete syntax and examples.
- Continue with **How Kire Works** for parser/compiler/runtime internals.
- Use **Components and Slots** for scalable template composition.
