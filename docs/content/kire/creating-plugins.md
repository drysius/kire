# Creating Plugins

Plugins are the standard way to extend Kire syntax and behavior.

## Plugin Structure

```ts
import { kirePlugin } from "kire";

export const MyPlugin = kirePlugin({}, (kire) => {
  kire.directive({
    name: "hello",
    onCall(api) {
      api.write("$kire_response += 'hello';");
    },
  });
});
```

Then register:

```ts
kire.plugin(MyPlugin);
```

## Add Directives

Use directives when you need template-level control or sugar syntax.

- Validate params clearly.
- Generate minimal JS code.
- Keep predictable output.

## Add Elements

Elements are useful for HTML-like DSLs (`<x-card>`, `<kire:if>`).

## Add Globals and Helpers

```ts
kire.$global("featureFlag", true);
```

## Safety Guidelines

- Do not execute untrusted code inside directives.
- Keep plugin APIs deterministic.
- Document syntax and examples.
- Add tests for parser edge cases.

## Production Notes

If your plugin has heavy compile-time work, cache by template id in production.
This keeps rendering stable under load.
