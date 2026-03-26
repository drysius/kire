---
route: "/docs/kire/elements-reference"
title: "Elements Reference"
description: "Reference for Kire native elements, x-* components, special raw tags, and the way package-defined elements extend HTML."
tags: ["elements", "kire:if", "x-*", "components", "custom elements", "reference"]
section: "Kire Reference"
order: 2
---

# Elements Reference

Kire supports three kinds of element syntax:

- normal HTML elements like `<div>` and `<section>`
- native Kire elements like `<kire:if>` and `<kire:for>`
- extensible custom elements added by Kire core or packages, like `<x-card>`, `<iconify>` or `<wire:chat>`

## Normal HTML elements

Standard HTML tags are preserved as HTML. Kire does not replace them unless a plugin explicitly registers a matching special element.

```kire
<section class="page-shell">
  <h1>{{ title }}</h1>
</section>
```

## Native `kire:*` control-flow elements

These are structural alternatives to directives like `@if` and `@for`.

### `<kire:if cond="...">`

Conditional branch.

```kire
<kire:if cond="user">
  <p>Hello {{ user.name }}</p>
</kire:if>
```

### `<kire:elseif cond="...">`

Follow-up branch for a previous `kire:if`.

```kire
<kire:if cond="status === 'draft'">
  <p>Draft</p>
</kire:if>
<kire:elseif cond="status === 'published'">
  <p>Published</p>
</kire:elseif>
<kire:else>
  <p>Unknown</p>
</kire:else>
```

### `<kire:else>`

Fallback branch for `kire:if` and `kire:elseif`.

### `<kire:for items="..." as="item" index="i">`

Loop element. `items` and `each` are accepted as the collection attribute.

```kire
<kire:for items="posts" as="post" index="i">
  <article>
    <strong>{{ i }}</strong>
    <span>{{ post.title }}</span>
  </article>
</kire:for>
```

Available attributes:

- `items` or `each`: collection expression
- `as`: current item variable name
- `index`: current index/key variable name

Kire also exposes `$loop` inside the block.

### `<kire:empty>`

Fallback block for loop-oriented structures.

```kire
<kire:for items="posts" as="post">
  <p>{{ post.title }}</p>
</kire:for>
<kire:empty>
  <p>No posts found.</p>
</kire:empty>
```

### `<kire:switch value="...">`, `<kire:case value="...">`, `<kire:default>`

Switch/case form in element syntax.

```kire
<kire:switch value="status">
  <kire:case value="'draft'">Draft</kire:case>
  <kire:case value="'published'">Published</kire:case>
  <kire:default>Unknown</kire:default>
</kire:switch>
```

## Directive-style `kire:*` aliases

Core also exposes several directive-style features as `kire:*` elements, so you can keep the template tree fully tag-based when that reads better.

### Include and reusable fragments

```kire
<kire:include path="partials.card" locals="{ title: pageTitle }" />

<kire:define name="hero">
  <h1>Hero</h1>
</kire:define>

<kire:defined name="hero">
  <h1>Fallback hero</h1>
</kire:defined>
```

### Component layouts and slots

```kire
<kire:layout path="layouts.app">
  <kire:section name="content">
    <p>Hello</p>
  </kire:section>
</kire:layout>
```

```kire
<kire:component path="components.card">
  <kire:slot name="header">Dashboard</kire:slot>
  Body
</kire:component>
```

Inside the target component or layout, you can also use:

```kire
<kire:yield name="header" default="'No header'" />
<kire:yield name="default" />
```

### Stack helpers

```kire
<kire:push name="scripts">
  <script src="/app.js"></script>
</kire:push>

<kire:stack name="scripts" />
```

## `x-*` component elements

Any `x-*` tag is treated as a component call.

```kire
<x-card>
  <x-slot name="header">Dashboard</x-slot>
  <p>Body</p>
</x-card>
```

If the `components` namespace exists, `x-card` resolves as `components.card`.

## Component prop binding forms

Kire supports a few useful ways to pass values into `x-*` components.

### Literal strings

```kire
<x-alert tone="success"></x-alert>
```

### Interpolated strings

```kire
<x-alert title="Hello {{ user.name }}"></x-alert>
```

### Quoted JavaScript expression with braces

```kire
<x-alert title="{computeTitle(user)}"></x-alert>
```

### Expression binding with `:`

```kire
<x-alert :title="pageTitle"></x-alert>
```

Use `:` when you want the value treated as an expression instead of a literal string.

## Slot element forms

These three forms are equivalent:

```kire
<x-slot name="header">Header</x-slot>
<x-slot:header>Header</x-slot:header>
<x-slot.header>Header</x-slot.header>
```

Unassigned children become the default slot.

## Raw `style` and `script`

Core registers `style` and `script` as raw elements. Their child content is forwarded without escaping the tag body.

```kire
<style>
  .card { display: grid; }
</style>

<script>
  window.boot = true;
</script>
```

Packages can override the runtime behavior of these tags. For example, `@kirejs/assets` captures them into asset stacks instead of writing them immediately.

## Package-defined elements

Packages can add their own elements to the language.

### Examples already supported in this monorepo

- `<iconify ... />` from `@kirejs/iconify`
- `<tailwind>...</tailwind>` from `@kirejs/tailwind`
- `<wire:* />`, `<kirewire:* />`, `<livewire:* />` from `@kirejs/wire`

Example:

```kire
<wire:chat room-id="{{ room.id }}" :limit="25" compact />
```

That mounts a KireWire component named `chat` and converts tag attributes into locals.

For `@kirejs/wire` specifically, these aliases are equivalent:

```kire
<wire:chat room-id="{{ room.id }}" />
<kirewire:chat room-id="{{ room.id }}" />
<livewire:chat room-id="{{ room.id }}" />
```

Attribute mapping follows the same rules used by `x-*` props:

- `room-id` becomes `roomId`
- `:limit="25"` is treated as an expression
- `compact` becomes `compact: true`

## When to use elements vs directives

Use elements when:

- you want tree-like HTML-friendly structure
- the feature reads better as a tag
- you are designing component-like APIs

Use directives when:

- the feature reads better inline
- it injects attributes or small expressions
- it works as a control keyword rather than a semantic tag

## Related pages

- [Components and Slots](/docs/kire/components-and-slots)
- [Attributes and Template Context](/docs/kire/attributes-and-context)
- [Directives Reference](/docs/kire/directives-reference)
- [@kirejs/wire](/docs/packages/wire)
