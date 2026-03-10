# @kirejs/auth

`@kirejs/auth` provides authentication and authorization directives in templates.

## Purpose

- simplify auth checks in markup
- expose Laravel-like directive ergonomics

## Common Directives

- `@auth`
- `@guest`
- `@can`
- `@canany`

## Typical Use

Inject auth context from request code, then keep templates declarative for visibility rules.
