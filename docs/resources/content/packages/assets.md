---
route: "/docs/packages/assets"
title: "@kirejs/assets"
description: "Asset stack management for scripts and styles with deduplication and predictable output order."
tags: ["assets", "scripts", "styles", "dedupe", "stacks"]
section: "Packages"
order: 3
---

# @kirejs/assets

`@kirejs/assets` captures scripts, styles and SVG references and emits them from a stable placeholder.

## Configuration

```ts
import { KireAssets } from "@kirejs/assets";

kire.plugin(KireAssets, {
  prefix: "_kire",
  domain: "https://cdn.example.com",
});
```

Options:

- `prefix`
- `domain`

## What it adds

- `@assets()`
- `@svg(path, attrs?)`
- captured `<style>` handling
- captured `<script>` handling

## Typical flow

Write assets in nested templates:

```kire
<style>
  .card { display: grid; }
</style>

<script>
  console.log("boot");
</script>
```

Then place the emission point in the layout:

```kire
<head>
  @assets()
</head>
```

The package hashes content, deduplicates it and writes final `<link>` and `<script>` tags once.

## SVG helper

```kire
@svg("./icons/logo.svg", { class: "size-5" })
```

That loads the SVG, registers it as an asset and emits an `<img>` pointing to the generated asset path.
