# @kirejs/iconify

`@kirejs/iconify` integrates Iconify with Kire templates.

## What It Adds

- `@icon(...)` for inline icon rendering
- `<iconify ... />` for declarative icon output
- on-demand icon loading with cache reuse
- pass-through attributes such as `class`, `width`, and `height`

## Typical Usage

```ts
import { Kire } from "kire";
import { KireIconify } from "@kirejs/iconify";

const kire = new Kire().plugin(KireIconify);
```

```kire
@icon("mdi:check", "text-green-500")

<iconify icon="mdi:home" class="size-5 text-sky-500" />
```

The directive and element docs are part of the package metadata, so `KIRE IntelliSense` can show hover text and examples for them.

## License

MIT
