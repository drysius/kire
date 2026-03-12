---
route: "/docs/packages/auth"
title: "@kirejs/auth"
description: "Authentication and authorization directives for conditional rendering in Kire templates."
tags: ["auth", "authorization", "permissions", "roles", "directives"]
section: "Packages"
order: 4
---

# @kirejs/auth

`@kirejs/auth` adds auth-aware directives so templates can express access rules directly.

## What It Solves

- show/hide sections by auth state
- role/permission-aware blocks
- consistent authorization checks in views

## Typical Directives

Depending on configuration, you can use patterns like:

```kire
@auth
  <a href="/dashboard">Dashboard</a>
@end

@guest
  <a href="/login">Login</a>
@end
```

```kire
@can("tickets.update")
  <button>Edit ticket</button>
@end
```

## Integration Notes

- bind your auth provider/session state before rendering
- keep permission names stable and explicit
- prefer policy-level checks in backend + directive checks in views

## Recommended Approach

Treat template auth directives as UI guards, not as your only security layer.
Always validate permissions server-side for sensitive actions.
