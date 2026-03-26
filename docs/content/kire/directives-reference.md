---
route: "/docs/kire/directives-reference"
title: "Directives Reference"
description: "Complete reference for native Kire directives, including signatures, behavior, closing rules, and practical examples."
tags: ["directives", "if", "for", "include", "component", "slot", "layout", "reference"]
section: "Kire Reference"
order: 1
---

# Directives Reference

This page documents all native directives shipped by Kire core.

For native element syntax like `<kire:if>` and `x-*`, see [Elements Reference](/docs/kire/elements-reference).
For attribute helpers and template context, see [Attributes and Template Context](/docs/kire/attributes-and-context).

## Output and Escaping

### `{{ expression }}`
Escaped output (HTML-safe).

```kire
<p>{{ user.name }}</p>
```

### `{{{ expression }}}`
Raw output (no HTML escaping).

```kire
<div>{{{ trustedHtml }}}</div>
```

### `@{{ expression }}`
Escapes interpolation syntax itself (prints `{{ ... }}` literally).

```kire
<p>@{{ user.name }}</p>
```

## Control Flow

### `@if(condition) ... @elseif(condition) ... @else ... @endif`
You can close with `@endif` or generic `@end`.

```kire
@if(user)
  <p>Welcome {{ user.name }}</p>
@elseif(guest)
  <p>Guest mode</p>
@else
  <p>Anonymous</p>
@endif
```

### `@unless(condition) ... @endunless`
Equivalent to `if (!condition)`.

```kire
@unless(user)
  <a href="/login">Login</a>
@endunless
```

### `@switch(expr)`, `@case(value)`, `@default`
Classic switch/case flow.

```kire
@switch(status)
  @case("draft")Draft@endcase
  @case("published")Published@endcase
  @defaultUnknown@enddefault
@endswitch
```

### `@isset(expr) ... @endisset`
Renders block when expression is not `undefined` and not `null`.

```kire
@isset(profile.bio)
  <p>{{ profile.bio }}</p>
@endisset
```

### `@empty(expr?) ... @endempty`
Two modes:

- Standalone check: true when value is falsy or empty array.
- Loop fallback: inside `@for` or `@each`, acts as the empty branch.

```kire
@empty(items)
  <p>No items</p>
@endempty
```

```kire
@for(item of items)
  <li>{{ item }}</li>
@empty
  <p>No items</p>
@endfor
```

## Loops

### `@for(expr) ... @endfor`
Supports arrays and objects.

```kire
@for(item of items)
  <li>{{ item }}</li>
@endfor
```

Object iteration:

```kire
@for(key in data)
  <li>{{ key }}</li>
@endfor
```

Index form:

```kire
@for((item, i) of items)
  <li>{{ i }} - {{ item }}</li>
@endfor
```

When referenced, Kire exposes:

- your index variable (`i` in the example)
- `$loop` object with `index`, `first`, `last`, `length`

### `@each(...)`
Alias of `@for` (same behavior).

## Composition

### `@include(path, locals?)`
Renders another template with merged local context.

```kire
@include("partials.card", { title: "Demo" })
```

### `@component(path, locals?) ... @endcomponent`
Renders another template and allows slot content.

```kire
@component("layouts.app", { pageTitle: "Dashboard" })
  @slot("content")
    <h1>Dashboard</h1>
  @endslot
@endcomponent
```

### `@layout(...)` and `@extends(...)`
Aliases for `@component(...)`.

### `@slot(name) ... @endslot`
Defines named slot content inside a component call.

```kire
@slot("header")
  <h2>Title</h2>
@endslot
```

### `@yield(name, default?)`
Reads slot content in the target component/layout.

```kire
<header>@yield("header", "Default header")</header>
```

### `@section(...)`
Alias for `@slot(...)`.

## Reusable Content Blocks

### `@define(name) ... @enddefine`
Stores rendered fragment in internal define map.

### `@defined(name) ... @enddefined`
Outputs define value if present, otherwise fallback block.

```kire
@define("hero")<h1>Hello</h1>@enddefine
@defined("hero")Fallback@enddefined
```

### `@stack(name)` and `@push(name) ... @endpush`
Useful for collecting scripts/styles and rendering later.

```kire
@stack("scripts")

@push("scripts")
  <script src="/a.js"></script>
@endpush

@push("scripts")
  <script src="/b.js"></script>
@endpush
```

## Attribute Helpers

These are meant to be used inside tags.

### `@class(classes)`
Accepts array/object/string.

```kire
<div @class(["btn", isPrimary ? "btn-primary" : ""] )></div>
```

### `@style(styles)`
Accepts array/object/string.

```kire
<div @style({ color: "red", display: visible ? "block" : "none" })></div>
```

### Boolean attributes

- `@checked(condition)`
- `@selected(condition)`
- `@disabled(condition)`
- `@readonly(condition)`

```kire
<input type="checkbox" @checked(done)>
```

## Utility Directives

### `@once ... @endonce`
Renders block once per render globals scope.

### `@error(field) ... @enderror`
Renders block when `$props.errors[field]` exists and exposes `$message`.

```kire
@error("email")
  <span>{{ $message }}</span>
@enderror
```

### `@csrf`
Renders hidden `_token` input from `$globals.csrf`.

```kire
<form method="POST">
  @csrf
</form>
```

### `@method("PUT" | "PATCH" | "DELETE" | ...)`
Renders hidden `_method` input.

```kire
<form method="POST">
  @csrf
  @method("PUT")
</form>
```

### `@let(expr)` and `@const(expr)`
Inject local JavaScript declarations in template body.

```kire
@let(total = items.length)
@const(title = "Orders")
<h1>{{ title }} ({{ total }})</h1>
```

### `@interface(typeOrShape, global?)`
Type-only directive for tooling/intellisense; no runtime output.

## Unknown Directives and Strict Mode

By default, unknown directives are preserved as text (`@something`).

If you want hard failures on typos, enable strict mode:

```ts
const kire = new Kire({ strict_directives: true });
```

Then unknown directives throw compile errors with file and position.

## Closing Rules Quick Guide

- `@if`: `@endif` or `@end`
- `@unless`: `@endunless` or `@end`
- `@for`: `@endfor` or `@end`
- `@each`: `@endeach` or `@end`
- `@switch`: `@endswitch` or `@end`
- `@isset`: `@endisset` or `@end`
- `@empty`: `@endempty` or parent loop end
- `@component`: `@endcomponent` or `@end`
- `@slot`: `@endslot` or `@end`
- `@define`: `@enddefine` or `@end`
- `@push`: `@endpush` or `@end`
- `@error`: `@enderror` or `@end`

## Related pages

- [Getting Started](/docs/kire/getting-started)
- [Elements Reference](/docs/kire/elements-reference)
- [Attributes and Template Context](/docs/kire/attributes-and-context)
