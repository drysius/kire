---
route: "/docs/packages/iconify"
title: "@kirejs/iconify"
description: "Render Iconify SVG icons directly in Kire templates with reusable helper patterns."
tags: ["iconify", "icons", "svg", "ui"]
section: "Packages"
order: 5
---

# @kirejs/iconify

`@kirejs/iconify` integrates Iconify icon sets into Kire.

## Configuration

```ts
import { KireIconify } from "@kirejs/iconify";

kire.plugin(KireIconify, {
  apiUrl: "https://api.iconify.design",
  defaultClass: "size-5",
});
```

Options:

- `apiUrl`
- `defaultClass`

## What it adds

- `@icon(name, className?, attrs?)`
- `<iconify ... />`

## Directive example

```kire
@icon("mdi:account", "text-blue-500", { width: "24" })
```

## Element example

```kire
<iconify icon="mdi:home" class="text-blue-500" width="24" />
```

Supported convenience attributes include:

- `icon` or `i`
- `class` or `className`
- `size`
- `width`
- `height`
- `color`
- `flip`
- `rotate`

The package fetches the SVG, injects attributes and returns inline SVG markup.
