---
route: "/docs/packages/iconify"
title: "@kirejs/iconify"
description: "Render Iconify SVG icons directly in Kire templates with reusable helper patterns."
tags: ["iconify", "icons", "svg", "ui"]
section: "Packages"
order: 5
---

# @kirejs/iconify

`@kirejs/iconify` integrates Iconify icon sets into Kire rendering.

## Why It Is Useful

- unified icon source for the whole app
- lightweight SVG output in templates
- no manual copy/paste of SVG paths

## Example Usage

```kire
@icon("mdi:account", { class: "w-5 h-5" })
@icon("lucide:search")
```

## Typical Scenarios

- admin dashboards
- action buttons and status indicators
- navigation menus with consistent icon style

## Best Practices

- standardize on one or two icon families
- wrap repeated icon patterns in small components
- avoid using too many unique icon packs in the same page
