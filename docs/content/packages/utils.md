---
route: "/docs/packages/utils"
title: "@kirejs/utils"
description: "Utility helpers for routes, HTML helpers, and common template ergonomics inspired by Laravel style APIs."
tags: ["utils", "helpers", "route", "html", "strings"]
section: "Packages"
order: 8
---

# @kirejs/utils

`@kirejs/utils` provides convenience globals and a few form-oriented directives.

## What it adds

- globals like `Str`, `Arr`, `Route`, `Html`
- `old(key, default?)`
- engine helpers `route(...)`, `withInput(...)`, `withErrors(...)`
- `@error(name)`
- `@old(name, default?)`

## Typical setup

```ts
import { KireUtils } from "@kirejs/utils";

kire.plugin(KireUtils);
kire.route("https://example.com");
```

## Examples

Old input:

```kire
<input type="email" name="email" value="@old('email')" />
```

Validation error:

```kire
@error("email")
  <span class="text-error">{{ $message }}</span>
@end
```

Request data:

```ts
kire.withInput(req.body);
kire.withErrors({
  email: ["Email is required"],
});
```

The package is useful when you want Laravel-style template ergonomics without wiring those helpers by hand in every project.
