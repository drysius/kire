---
route: "/docs/wire/decorators"
title: "Decorators"
description: "Every Kirewire decorator: @Component, @prop, @locked, @computed, @renderless, @on, @validate, @action, @lazy, @url — what they declare and how the runtime uses them."
tags: ["wire", "decorators", "prop", "locked", "computed", "validate"]
section: "Kirewire"
order: 3
---

# Decorators

Kirewire uses standard (TC39) decorators — no `experimentalDecorators`, no
`reflect-metadata`. Each one records metadata that features and the pipeline read.

## `@Component(name)`

Registers the class under a name used by `@wire("name")` and `wire.component()`.

```ts
@Component("counter")
export class Counter extends LiveComponent {}
```

## `@prop`

Declares a reactive, **client-writable** property. Required for `wire:model`
two-way binding and `$set`.

```ts
@prop count = 0;
@prop form = { title: "", body: "" };   // nested paths bind too: wire:model="form.title"
```

## `@locked`

A property the client may never write. Attempting to update it (via `wire:model`
or `$set`) throws server-side. Use it for ids and trust-sensitive fields.

```ts
@locked @prop userId!: string;
```

## `@computed`

Exposes a getter's value to the view (read-only). Computed values are injected
into the template scope alongside properties.

```ts
@prop count = 0;
@computed get doubled() { return this.count * 2; }
```

```html
<span>{{ doubled }}</span>
```

## `@renderless`

Marks a method that runs **without** triggering a re-render. Good for fire-and-forget
side effects (logging, analytics).

```ts
@renderless ping() { metrics.hit("ping"); }
```

## `@on(event)`

Calls the method when a matching event is dispatched (from this component, another
component, or the client). The event→method map is published in the snapshot so the
client knows where to route dispatches.

```ts
@on("post:saved") refresh() { this.reload(); }
```

See [Events & broadcasting](/docs/wire/events-and-broadcasting).

## `@validate(rule)`

Attaches a validation rule to a property; it runs when the property is updated.
A rule is either a predicate returning an error message (or `null` when valid),
or a schema-like object exposing `safeParse` (Zod) — kept dependency-free.

```ts
@validate((v) => (typeof v === "string" && v.length >= 3 ? null : "Too short"))
@prop title = "";

// or a Zod schema:
@validate(z.string().email()) @prop email = "";
```

Errors land in an `$errors` bag exposed to the view and returned to the client as
an effect. See [Validation & forms](/docs/wire/validation-and-forms).

## `@action`

Explicitly allowlists a method as client-callable. When any method on a component
carries `@action`, only `@action` methods are callable (opt-in allowlist mode)
instead of the default "all public subclass methods" rule.

```ts
@action publish() {}
internalHelper() {}   // not callable once @action is used anywhere
```

## `@lazy`

Defers the component's first render until it scrolls into view. Mount emits a tiny
placeholder containing `wire:init="$call('__lazyLoad')"`; the real `mount()` and
render run on load.

```ts
@Component("heavy-report")
@lazy
export class HeavyReport extends LiveComponent {}
```

## `@url`

Mirrors a property to the page's query string. On each response the feature emits a
`url` effect and the client patches `history` (no navigation).

```ts
@url @prop page = 1;
@url @prop q = "";
```

Read the initial values back by passing query params as mount params.
