# @kirejs/markdown

Adds Markdown rendering capabilities directly to Kire templates.

## Features

- **`@markdown()` directive** for inline markdown or file paths.
- **Wildcard support** via patterns like `posts/*.md`.
- **`@mdslots()` directive** to preload markdown collections.

## Installation

```bash
npm install @kirejs/markdown
# or
bun add @kirejs/markdown
```

## Usage

```html
@markdown("# Hello World")
@markdown("content/post.md")
@markdown("content/*.md")

@mdslots("posts/*.md", "posts")
```

## License

MIT
