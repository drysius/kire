# @kirejs/auth

`@kirejs/auth` adds authentication and permission directives to Kire templates.

## What It Adds

- `@auth`, `@guest`, `@noauth`
- aliases such as `@logged`, `@authenticated`, and `@notlogged`
- permission checks with `@can`, `@notcan`, and `@canany`
- `@user`, which injects the current authenticated user into the template scope

## Typical Usage

```ts
import { Kire } from "kire";
import { KireAuth } from "@kirejs/auth";

const kire = new Kire().plugin(KireAuth, {
	getUser: async () => ({ id: 1, name: "Danie" }),
	canPerm: async (perm, user) => Boolean(user) && perm === "edit_posts",
});
```

```kire
@auth
	@user
	<p>Hello {{ user.name }}</p>
@else
	<a href="/login">Login</a>
@end

@can("edit_posts")
	<button>Edit</button>
@end
```

The package attaches descriptions, examples, and declarations to its directives so editor tooling such as `KIRE IntelliSense` can explain what each auth directive does.

## License

MIT
