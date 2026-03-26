# @kirejs/assets

`@kirejs/assets` adds asset capture and injection helpers to Kire.

## What It Adds

- `@assets()` placeholder injection
- `@svg(path, attrs)` for SVG asset loading
- inline `<style>` capture with hashed CSS output
- inline `<script>` capture with hashed JS or module output
- cached in-memory asset registration through Kire globals

## Typical Usage

```ts
import { Kire } from "kire";
import { KireAssets } from "@kirejs/assets";

const kire = new Kire().plugin(KireAssets, {
	prefix: "_kire",
});
```

```kire
<head>
	@assets()
</head>

<style>
	.card { color: red; }
</style>

@svg("./icons/logo.svg", { class: "h-4 w-4" })
```

The package registers metadata for the directives and elements it adds, which is what `KIRE IntelliSense` can use to describe them in the editor.

## License

MIT
