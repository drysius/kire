---
route: "/docs/packages/core"
title: "kire (core)"
description: "Core package of the Kire engine: compilation, rendering, namespaces, cache, and plugin extension points."
tags: ["core", "engine", "compile", "render", "plugin"]
section: "Packages"
order: 1
---

# kire (core)

`kire` is the engine package. It handles parsing, compilation, rendering, caching and the plugin API used by every other package in this repository.

## Install

```bash
bun add kire
# or
npm install kire
```

## Minimal setup

```ts
import { Kire } from "kire";

const kire = new Kire({
  root: "./views",
  production: process.env.NODE_ENV === "production",
  strict_directives: true,
});

kire.namespace("layouts", "./views/layouts");
kire.namespace("components", "./views/components");
kire.namespace("pages", "./views/pages");

const html = await kire.view("pages.home", { user });
```

## What core adds

Core gives you:

- the `Kire` class
- native directives such as `@if`, `@for`, `@include`, `@layout`, `@class`
- native elements such as `kire:*` and `x-*`
- engine globals, caching and request forking
- schema-aware registration APIs for plugins and tooling

## Important options

- `root`: base folder for `view()`
- `production`: cache behavior
- `async`: async or sync mode
- `extension`: template extension
- `silent`: suppress early compile logging
- `strict_directives`: fail on unknown directives
- `local_variable`: alias for locals, default `it`
- `max_renders`: inline template cache size
- `files`: in-memory file map
- `emptykire`: start without native directives/elements

## Main APIs

### `view(path, locals)`

Render a file-backed or virtual file template.

```ts
await kire.view("pages.dashboard", { stats });
```

### `render(template, locals)`

Render an inline template string.

```ts
await kire.render("<h1>{{ title }}</h1>", { title: "Hello" });
```

### `namespace(name, path)`

```ts
kire.namespace("components", "./views/components");
```

### `fork()`

Use per request when you set request-scoped globals:

```ts
const viewKire = kire.fork();
viewKire.$global("user", req.user);
```

### `plugin(...)`

```ts
kire.plugin(MyPlugin);
```

## Language features shipped by core

### Directives

Examples:

- `@if`, `@elseif`, `@else`, `@unless`
- `@for`, `@each`, `@empty`
- `@switch`, `@case`, `@default`
- `@include`, `@component`, `@layout`, `@slot`, `@yield`
- `@define`, `@defined`, `@push`, `@stack`
- `@attr`, `@attrs`, `@class`, `@style`
- `@csrf`, `@method`, `@error`, `@let`, `@const`, `@interface`

### Elements

Examples:

- `<kire:if>`
- `<kire:for>`
- `<kire:switch>`
- `<x-card>`
- `<x-slot>`
- raw `<style>` and `<script>`

## Browser runtime

Core also exports a browser-safe entrypoint:

```ts
import { Kire } from "kire/browser";
```

Use it with the `files` option for in-memory templates and client-side sandboxes.

## Extension points

Core exposes everything packages need:

- `kire.directive(...)`
- `kire.element(...)`
- `kire.attribute(...)`
- `kire.type(...)`
- `kire.kireSchema(...)`
- `kire.$global(...)`
- `kire.onFork(...)`

## Where to go next

- [Getting Started](/docs/kire/getting-started)
- [Directives Reference](/docs/kire/directives-reference)
- [Elements Reference](/docs/kire/elements-reference)
- [Creating Plugins](/docs/kire/creating-plugins)
