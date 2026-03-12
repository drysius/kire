---
route: "/docs/packages/markdown"
title: "@kirejs/markdown"
description: "Render markdown strings/files in Kire templates with glob support and markdown slot utilities."
tags: ["markdown", "md", "content", "docs", "mdslots"]
section: "Packages"
order: 6
---

# @kirejs/markdown

`@kirejs/markdown` lets Kire render Markdown as part of template output.

## Features

- render markdown from inline strings
- render markdown from files
- load multiple markdown files via glob patterns
- protect Kire syntax inside code blocks

## Directives

```kire
@markdown("# Hello from markdown")
@markdown("content/post.md")
@markdown("content/posts/*.md")
```

```kire
@mdslots("content/posts/*.md", "posts")
```

## Frontmatter Support

When a markdown file starts with frontmatter (`---` block), the markdown renderer strips it before generating HTML.
This is useful for docs systems where metadata drives routing/search.

## Typical Use Cases

- documentation websites
- blog/content pages
- hybrid template pages that mix markdown + Kire components

## Notes

- markdown rendering output is still executed through Kire, so template expressions/directives can be evaluated.
- keep untrusted markdown sanitized at the application boundary when needed.
