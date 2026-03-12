---
route: "/docs/packages/tailwind"
title: "@kirejs/tailwind"
description: "Tailwind integration for Kire projects, focused on class extraction, build flow, and runtime-friendly output."
tags: ["tailwind", "css", "build", "classes", "integration"]
section: "Packages"
order: 7
---

# @kirejs/tailwind

`@kirejs/tailwind` helps Kire projects integrate Tailwind CSS efficiently.

## Goals

- align template files with Tailwind scanning/extraction
- simplify generated CSS flow for Kire-based apps
- keep style output deterministic between environments

## Typical Workflow

1. write Tailwind classes in `.kire` templates
2. run Tailwind build/extraction pipeline
3. serve generated CSS through your asset strategy

## Where It Helps

- Kire-first apps where templates are the main view source
- monorepos with shared components and predictable build targets
- teams that want utility CSS without custom parser glue code

## Recommendations

- keep class naming intentional and reusable
- segment large utility sets with component-level patterns
- combine with `@kirejs/assets` for stable style injection
