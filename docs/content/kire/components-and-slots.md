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

- directive-based composition with `@component`, `@slot`, `@yield`, `@layout` and `@extends`
- element-based composition with `x-*` and `x-slot`

They compile to the same component model: a parent render builds props, collects slot content, then calls another Kire template.

## Directive-based components

### Caller

```kire
@component("layouts.app", { pageTitle: "Dashboard" })
  @slot("header")
    <h1>Dashboard</h1>
  @end

  @slot("default")
    <p>Welcome back</p>
  @end
@end
```

### Target component

`layouts/app.kire`

```kire
<html>
  <body>
    <header>@yield("header", "Default header")</header>
    <main>@yield("default")</main>
  </body>
</html>
```

### What Kire does internally

1. resolves the component path
2. renders slot blocks into a `$slots` object
3. merges parent locals with your component locals
4. calls the target template
5. lets the target pull slot values with `@yield(...)`

## `@layout(...)` and `@extends(...)`

These are aliases of `@component(...)`. They exist for readability.

Use `@layout` when a page wraps itself in a layout:

```kire
@layout("layouts.docs")
  @section("content")
    <h1>{{ title }}</h1>
  @end
@end
```

Use `@extends` when you prefer inheritance-oriented naming.

## `@include(...)` vs `@component(...)`

Use `@include` when you only need locals:

```kire
@include("partials.card", { title: "Quick card" })
```

Use `@component` or `x-*` when you need slots and a stronger component contract.

## Element-based components with `x-*`

Any `x-*` tag is treated as a component element.

```kire
<x-card>
  <x-slot name="header">Profile</x-slot>
  <p>Main content</p>
</x-card>
```

If the `components` namespace exists, `x-card` resolves as `components.card`.

## Prop binding forms

Kire lets you pass props in a few useful forms.

### Plain string

```kire
<x-alert tone="success"></x-alert>
```

### Interpolated string

```kire
<x-alert title="Hello {{ user.name }}"></x-alert>
```

### Forced expression in braces

```kire
<x-alert title="{computeTitle(user)}"></x-alert>
```

### Expression prop with `:`

```kire
<x-alert :title="pageTitle"></x-alert>
```

Use `:` when the prop should stay a JavaScript expression instead of becoming a literal string.

## Slot element forms

All of these are valid:

```kire
<x-slot name="header">...</x-slot>
<x-slot:header>...</x-slot:header>
<x-slot.header>...</x-slot.header>
```

Children outside named slots become the default slot.

## Layout pattern

A common page pattern looks like this:

```kire
@layout("layouts.app", { title })
  @section("sidebar")
    <x-doc-nav :items="docsNav"></x-doc-nav>
  @end

  @section("content")
    <article>
      <h1>{{ title }}</h1>
      {{{ body }}}
    </article>
  @end
@end
```

## Recommended structure

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

## Practical rules

- keep component inputs explicit
- prefer small reusable templates over giant multi-mode files
- treat slot names as public API
- use `@include` for simple partials and `@component` or `x-*` for real composition boundaries

## Related pages

- [Elements Reference](/docs/kire/elements-reference)
- [Directives Reference](/docs/kire/directives-reference)
- [Browser Runtime and Playground](/docs/kire/browser-playground)
