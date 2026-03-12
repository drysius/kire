---
route: "/docs/packages/assets"
title: "@kirejs/assets"
description: "Asset stack management for scripts and styles with deduplication and predictable output order."
tags: ["assets", "scripts", "styles", "dedupe", "stacks"]
section: "Packages"
order: 3
---

# @kirejs/assets

`@kirejs/assets` provides a clean way to register and render scripts/styles across nested templates.

## Why Use It

- avoid duplicated `<script>` and `<link>` tags
- keep output order deterministic
- collect assets from partials/components and render once in layout

## Typical Pattern

1. push assets from pages/components
2. render stack in the main layout

```kire
@push("styles", '<link rel="stylesheet" href="/app.css">')
@push("scripts", '<script src="/app.js" defer></script>')
```

```kire
<head>
  @stack("styles")
</head>
<body>
  @stack("scripts")
</body>
```

## Use Cases

- multi-page apps with per-page bundles
- plugin modules that need to inject assets
- component libraries with optional JS/CSS

## Best Practices

- keep stack names consistent (`styles`, `scripts`, `head`, `footer`)
- avoid inline scripts when possible
- pair with build hashing/versioning for cache correctness
