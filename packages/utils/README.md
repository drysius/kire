# @kirejs/utils

`@kirejs/utils` adds Laravel-style helpers to Kire templates.

## What It Adds

- global helpers such as `Route`, `Html`, `Str`, `Arr`, `errors`, `old`, and `url`
- instance helpers such as `route(...)`, `withInput(...)`, and `withErrors(...)`
- `@error(...)` and `@old(...)` directives

## Typical Usage

```ts
import { Kire } from "kire";
import KireUtils from "@kirejs/utils";

const kire = new Kire().plugin(KireUtils);

const requestKire = kire.fork();
requestKire.route("https://example.com/admin/dashboard", "admin.dashboard");
requestKire.withInput({ email: "demo@example.com" });
requestKire.withErrors({ email: ["Invalid email address"] });
```

```kire
@error("email")
	<span class="error">{{ $message }}</span>
@end

<input name="email" value="@old('email')" />

@if(Route.is("admin.*"))
	<a href="{{ url('profile') }}">Profile</a>
@end
```

The directive metadata exposed here is also what `KIRE IntelliSense` can use to explain `@error` and `@old`.

## License

MIT
