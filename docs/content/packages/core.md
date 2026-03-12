---
route: "/docs/packages/core"
title: "kire (core)"
description: "Core package of the Kire engine: compilation, rendering, namespaces, cache, and plugin extension points."
tags: ["core", "engine", "compile", "render", "plugin"]
section: "Packages"
order: 1
---

# kire (core)

`kire` is the engine package. It handles template parsing, compilation, and rendering.

## What It Provides

- template compile/runtime pipeline
- file and namespace resolution
- globals and locals execution context
- plugin system for directives/elements/helpers
- cache-aware rendering behavior

## Core API Surface

```ts
import { Kire } from "kire";

const kire = new Kire({ root: "./views" });

kire.namespace("pages", "./views/pages");
kire.$global("appName", "KireApp");

const html = await kire.view("pages.home", { user });
```

## Typical Use Cases

- SSR apps with custom HTML templates
- framework adapters that need a deterministic view layer
- plugin-driven template language extensions

## Extension Points

- `kire.directive(...)`
- custom elements registration via plugin API
- plugin lifecycle hooks
- global helper injection (`$global`)

## Performance Notes

- cache compiled templates in production
- avoid expensive calculations inside templates
- pass precomputed values from services/controllers

## Works Well With

- `@kirejs/wire` for interactive server-driven components
- `@kirejs/markdown` for content pages
- `@kirejs/assets` for managed script/style output
