---
route: "/docs/kire/components-and-slots"
title: "Components and Slots"
description: "Compose reusable Kire UI with @component, x-* elements, named slots, and layout boundaries for large applications."
tags: ["components", "slots", "layout", "x-component", "composition", "reuse"]
section: "Kire Essentials"
order: 2
---

# Components and Slots

Kire supports two composition styles:

- directive-based (`@component`, `@slot`, `@yield`)
- element-based (`<x-card>`, `<x-slot>`)

Both styles map to the same component execution model.

## Directive-Based Components

### Caller

```kire
@component("layouts.app", { pageTitle: "Dashboard" })
  @slot("header")
    <h1>Dashboard</h1>
  @endslot

  @slot("default")
    <p>Welcome back</p>
  @endslot
@endcomponent
```

### Target (`layouts/app.kire`)

```kire
<html>
  <body>
    <header>@yield("header", "Default Header")</header>
    <main>@yield("default")</main>
  </body>
</html>
```

`@layout(...)` and `@extends(...)` are aliases of `@component(...)`.

## Element-Based Components (`x-*`)

Kire resolves `<x-name>` as a component template.

```kire
<x-card>
  <x-slot name="header">Profile</x-slot>
  Main content
</x-card>
```

Default slot = children not captured by named `x-slot`.

### Slot naming forms

All forms below are valid:

```kire
<x-slot name="header">...</x-slot>
<x-slot:header>...</x-slot:header>
<x-slot.header>...</x-slot.header>
```

## How Component Resolution Works

1. Kire resolves component path (with namespaces).
2. It creates a `$slots` object.
3. Caller children are rendered into named/default slots.
4. Target component receives merged props plus `{ slots }`.
5. Target reads slots with `@yield(...)`.

## Include vs Component

Use `@include` when:

- you only need to inject locals
- you do not need named/default slot contracts

Use `@component` or `x-*` when:

- parent-child composition needs explicit slot boundaries
- layout-like APIs should be stable and reusable

## Native `kire:*` Element Syntax

Kire also supports native control-flow elements:

- `<kire:if cond="...">`
- `<kire:elseif cond="...">`
- `<kire:else>`
- `<kire:for items="..." as="item" index="i">`
- `<kire:switch value="...">`, `<kire:case value="...">`, `<kire:default>`

Example:

```kire
<kire:if cond="user">
  <p>Hello {{ user.name }}</p>
</kire:if>
<kire:else>
  <p>Please login</p>
</kire:else>
```

## Recommended Structure

```text
views/
  layouts/
    app.kire
    docs.kire
  components/
    card.kire
    button.kire
    ui/
      list.kire
      list/
        item.kire
  pages/
    dashboard.kire
```

## Practical Tips

- Keep component inputs explicit (`user`, `title`, `actions`).
- Avoid deep implicit global dependencies inside components.
- Prefer small composable components over large multi-mode templates.
- Treat slots as public API contracts between caller and component.
