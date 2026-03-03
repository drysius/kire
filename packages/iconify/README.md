# @kirejs/iconify

Integration with Iconify for Kire templates. Allows you to easily render thousands of icons from various icon sets directly in your server-rendered views.

## Features

- **`<iconify />` element** with `i`/`icon` attribute.
- **`@icon()` directive** for inline rendering.
- **On-demand loading + cache** to avoid repeated fetches.
- **Attribute pass-through** (`width`, `height`, `class`, etc.).

## Installation

```bash
npm install @kirejs/iconify
# or
bun add @kirejs/iconify
```

## Usage

```html
<iconify i="mdi:home" class="text-red-500" />
@icon("mdi:check", "text-green-500", { width: "20", height: "20" })
```

## License

MIT
