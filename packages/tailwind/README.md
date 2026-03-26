# @kirejs/tailwind

`@kirejs/tailwind` compiles Tailwind CSS directly from Kire templates.

## What It Adds

- `@tailwind ... @end`
- `<tailwind>...</tailwind>`
- Tailwind compilation with cache reuse in production
- optional integration with `@kirejs/assets` for hashed CSS output instead of inline `<style>`

## Typical Usage

```ts
import { Kire } from "kire";
import { KireTailwind } from "@kirejs/tailwind";

const kire = new Kire().plugin(KireTailwind);
```

```kire
@tailwind
	.btn { @apply rounded bg-black px-4 py-2 text-white; }
@end

<tailwind id="layout-css">
	.card { @apply rounded-xl border p-6; }
</tailwind>
```

Descriptions and examples for the directive and element are registered in the plugin so `KIRE IntelliSense` can surface them inside the editor.

## License

MIT
