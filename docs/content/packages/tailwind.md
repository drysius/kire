---
route: "/docs/packages/tailwind"
title: "@kirejs/tailwind"
description: "Tailwind integration for Kire projects, focused on class extraction, build flow, and runtime-friendly output."
tags: ["tailwind", "css", "build", "classes", "integration"]
section: "Packages"
order: 7
---

# @kirejs/tailwind

`@kirejs/tailwind` compiles Tailwind CSS from inside Kire templates.

## What it adds

- `<tailwind>...</tailwind>`
- `@tailwind(...)`
- integration with `@kirejs/assets` when both are installed

## Examples

Element form:

```kire
<tailwind>
  @import "tailwindcss";

  .card {
    @apply rounded-2xl border p-4;
  }
</tailwind>
```

Directive form:

```kire
@tailwind("
  @import \"tailwindcss\";
  .btn { @apply px-4 py-2 rounded-xl; }
")
```

If `@kirejs/assets` is present, compiled CSS is pushed into the asset pipeline. Otherwise the package writes a `<style>` tag directly.

## Configuration

The plugin forwards Tailwind compile options, so configure it the same way you would configure the underlying Tailwind compile call.
