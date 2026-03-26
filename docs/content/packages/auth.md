---
route: "/docs/packages/auth"
title: "@kirejs/auth"
description: "Authentication and authorization directives for conditional rendering in Kire templates."
tags: ["auth", "authorization", "permissions", "roles", "directives"]
section: "Packages"
order: 4
---

# @kirejs/auth

`@kirejs/auth` adds auth-aware directives to Kire.

## Configuration

The plugin expects two callbacks:

- `getUser(ctx)`: return the current user or `null`
- `canPerm(perm, user)`: return whether the user has a permission

```ts
import { KireAuth } from "@kirejs/auth";

kire.plugin(KireAuth, {
  getUser: async () => session.user || null,
  canPerm: async (perm, user) => {
    return Boolean(user?.permissions?.includes(perm));
  },
});
```

## Directives added

- `@auth`
- `@guest`
- `@notlogged`
- `@logged`
- `@authenticated`
- `@user`
- `@can`
- `@notcan`
- `@canany`
- `@noauth`

## Common examples

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

```kire
@canany(["posts.edit", "posts.delete"])
  <button>Manage post</button>
@end
```

`@user` injects the authenticated user into a `user` variable:

```kire
@user
<p>Hello {{ user.name }}</p>
```

## Important note

These are UI guards, not your only security boundary. Continue enforcing permissions server-side in your actions and routes.
