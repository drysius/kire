# @kirejs/vite

`@kirejs/vite` connects Kire to Vite with Laravel-style asset tags.

## What It Adds

- runtime `@vite(...)` directive
- development support through the Vite hot file
- production support through `manifest.json`
- a Vite plugin that can also bundle `.kire` views when required

## Typical Usage

```ts
import { defineConfig } from "vite";
import kire from "@kirejs/vite";

export default defineConfig({
	plugins: [
		kire({
			publicDirectory: "public",
			buildDirectory: "build",
			input: ["css/app.css", "js/app.js"],
		}),
	],
});
```

```kire
@vite()
@vite("js/app.js")
@vite(["css/app.css", "js/app.js"])
```

The package registers directive documentation so `KIRE IntelliSense` can describe `@vite(...)` in the editor.

## License

MIT
