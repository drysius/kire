---
route: "/docs/kire/attributes-and-context"
title: "Attributes and Template Context"
description: "Learn how locals, globals, interpolation and attribute helper directives work in Kire templates."
tags: ["attributes", "context", "globals", "locals", "class", "style", "forms"]
section: "Kire Reference"
order: 3
---

# Attributes and Template Context

This page covers the values available inside templates and the helpers Kire gives you to build HTML attributes cleanly.

## Template context

Kire templates can see three main context objects:

- your `local_variable` alias, which is `it` by default
- `$props`, the current local render data
- `$globals`, shared values injected by the engine

Example:

```ts
kire.$global("appName", "Kire");

await kire.view("pages.home", {
  user: { name: "Ada" },
  stats: { posts: 4 },
});
```

```kire
<header>{{ $globals.appName }}</header>
<h1>{{ it.user.name }}</h1>
<p>{{ $props.stats.posts }}</p>
```

## Changing the local alias

```ts
const kire = new Kire({
  local_variable: "page",
});
```

Then:

```kire
<h1>{{ page.title }}</h1>
```

## HTML attribute interpolation

Kire interpolation works inside attribute values too.

```kire
<a href="/posts/{{ post.slug }}">{{ post.title }}</a>
```

You can also build full text values:

```kire
<img alt="Cover for {{ post.title }}">
```

## `@attr(name, value)`

Writes one attribute when the value is not `false`, `null` or `undefined`.

```kire
<button @attr("data-id", post.id)>Open</button>
```

Boolean `true` values render the attribute name without `="..."`.

## `@attrs(attributes)`

Writes many attributes from an object, array or string-like shorthand.

```kire
<button
  @attrs({
    type: "button",
    disabled: isSaving,
    "data-id": post.id
  })
>
  Save
</button>
```

## `@class(classes)`

Builds a `class` attribute from strings, arrays or keyed objects.

```kire
<button
  @class([
    "btn",
    "btn-primary",
    { "is-loading": isSaving }
  ])
>
  Save
</button>
```

## `@style(styles)`

Builds a `style` attribute from strings, arrays or keyed objects.

```kire
<div
  @style({
    display: isOpen && "block",
    color: accent
  })
></div>
```

## Boolean attribute helpers

Core ships dedicated helpers for common HTML boolean attributes:

- `@checked(condition)`
- `@selected(condition)`
- `@disabled(condition)`
- `@readonly(condition)`
- `@required(condition)`

Example:

```kire
<input type="checkbox" @checked(todo.done)>
```

## Forms and request helpers

### `@csrf`

Requires a global `csrf` value:

```ts
kire.$global("csrf", token);
```

```kire
<form method="POST">
  @csrf()
</form>
```

### `@method("PUT")`

Useful for method spoofing in traditional form flows.

```kire
<form method="POST">
  @csrf()
  @method("PATCH")
</form>
```

### `@error("field")`

Renders only when the selected field has an error and exposes `$message`.

```kire
@error("email")
  <span class="text-error">{{ $message }}</span>
@end
```

## Declaring variables in the template

### `@let(expr)`

Mutable local declaration:

```kire
@let(total = items.length)
```

### `@const(expr)`

Constant declaration:

```kire
@const(pageTitle = "Dashboard")
```

## Tooling-only context with `@interface(...)`

`@interface` does not render output. It exists for editor tooling and documentation-friendly typing.

```kire
@interface({ user: AppUser, posts: Post[] }, true)
```

Use it when you want better IntelliSense or a clearer contract for a view file.

## Request-safe globals with `fork()`

Globals are shared by an engine instance, so request-specific values should normally be set on a fork:

```ts
const viewKire = kire.fork();
viewKire.$global("user", req.user);
viewKire.$global("csrf", req.csrfToken());
```

## Package attributes

Packages can extend the attribute space too. For example, `@kirejs/wire` adds:

- `wire:model`
- `wire:click`
- `wire:loading`
- `wire:navigate`
- `wire:*`

See:

- [@kirejs/wire](/docs/packages/wire)
- [Elements Reference](/docs/kire/elements-reference)
