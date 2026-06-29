---
route: "/docs/packages/markdown"
title: "@kirejs/markdown"
description: "Render markdown strings/files in Kire templates with glob support and markdown slot utilities."
tags: ["markdown", "md", "content", "docs", "mdslots"]
section: "Packages"
order: 6
---

# @kirejs/markdown

`@kirejs/markdown` renders Markdown inside Kire templates and preserves Kire syntax safely inside code blocks.

## What it adds

- `@markdown(source)`
- `@mdslots(pattern, name)`
- global helpers like `$mdrender` and `$readdir`
- `kire.mdrender(...)`
- `kire.mdview(...)`

## Examples

Inline markdown:

```kire
@markdown("# Hello from markdown")
```

File path:

```kire
@markdown("content/post.md")
```

Glob pattern:

```kire
@markdown("content/posts/*.md")
```

Slot map:

```kire
@mdslots("content/posts/*.md", "posts")
```

## Behavior

- frontmatter blocks are stripped before rendering
- markdown HTML is still compiled through Kire afterwards
- code blocks are protected so `@directives` and `{{ interpolation }}` inside code samples are not executed

That makes the package a good fit for docs, blogs and content-heavy apps built with Kire.
