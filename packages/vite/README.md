# @kirejs/vite

Laravel-style Vite integration for Kire.

## Features

- Vite plugin with `publicDirectory`, `buildDirectory`, `input`, `manifest.json`, and `.kire` refresh.
- Optional `.kire` template bundle mode (`kire: true`) using `Kire.compileAndBuild`.
- Runtime Kire plugin with `@vite(...)` directive for dev (`hot`) and production (`manifest.json`).

## Installation

```bash
npm install @kirejs/vite
# or
bun add @kirejs/vite
```

## Vite Usage

```ts
import { defineConfig } from "vite";
import kire from "@kirejs/vite";

export default defineConfig({
	plugins: [
		kire({
			publicDirectory: "../../public",
			buildDirectory: "themes/phoenix",
			input: ["./css/app.css", "js/app.js"],
		}),
		kire({
			kire: true,
			root: "views",
			namespaces: {
				views: ["views/**/*.kire"],
			},
			outfile: ".kire.builded.js",
		}),
	],
});
```

## Kire Runtime Usage

```ts
import { Kire } from "kire";
import { KireVite } from "@kirejs/vite";

const kire = new Kire({ root: "views" }).plugin(KireVite, {
	publicDirectory: "public",
	buildDirectory: "themes/phoenix",
	input: ["css/app.css", "js/app.js"],
});
```

```kire
@vite()
@vite("js/app.js")
@vite(["css/app.css", "js/app.js"])
```

## License

MIT
