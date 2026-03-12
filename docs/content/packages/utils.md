---
route: "/docs/packages/utils"
title: "@kirejs/utils"
description: "Utility helpers for routes, HTML helpers, and common template ergonomics inspired by Laravel style APIs."
tags: ["utils", "helpers", "route", "html", "strings"]
section: "Packages"
order: 8
---

# @kirejs/utils

`@kirejs/utils` provides helper functions and template conveniences used across Kire views.

## Utility Scope

- route/path helpers
- HTML helper shortcuts
- common formatting and utility functions

## Why It Exists

Templates often repeat small operations (route URLs, attribute helpers, formatting).
A utility package centralizes these patterns and keeps templates cleaner.

## Practical Benefits

- fewer ad-hoc helper functions in every project
- consistent behavior across pages/components
- easier migration from Laravel-like template habits

## Usage Guidance

- prefer helpers for repeated primitives only
- do not hide business rules in utility helpers
- keep helper names explicit and domain-safe

## Works Well With

- `kire` core templates
- `@kirejs/wire` components
- package-level docs/layout templates where helper reuse is frequent
