# @kirejs/tailwind

Tailwind CSS integration helpers for Kire. Streamlines the usage of utility classes and conditional styling within Kire templates.

## Features

- **`@tailwind ... @end` directive** to compile CSS on render.
- **`<tailwind>...</tailwind>` element** support.
- **Production cache** for compiled CSS.
- **Optional integration with `@kirejs/assets`** for hashed CSS output.

## Installation

```bash
npm install @kirejs/tailwind
# or
bun add @kirejs/tailwind
```

## Usage

```html
@tailwind
.btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded; }
@end

<tailwind id="layout-css">
.card { @apply p-4 border rounded-lg; }
</tailwind>
```

## License

MIT
