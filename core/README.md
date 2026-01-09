# Kire Core

The core engine of **Kire**, a powerful, expressive, and lightweight template engine for JavaScript/TypeScript environments. Kire is designed to be fast, extensible via plugins, and familiar to developers used to Blade (Laravel) or Edge (AdonisJS).

## Features

- **Expressive Syntax**: Clean and readable directives like `@if`, `@for`, `@include`, `@component`.
- **Async Support**: First-class support for asynchronous operations within templates.
- **Extensible**: robust plugin system to add custom directives, elements, and functionality.
- **Components & Slots**: Modern component architecture with slot support.
- **High Performance**: Compiles templates to efficient JavaScript functions.
- **Zero Dependencies**: The core logic is self-contained.

## Installation

```bash
npm install kire
# or
bun add kire
```

## Basic Usage

```typescript
import { Kire } from 'kire';

const kire = new Kire();

const template = `
  <h1>Hello, {{ name }}!</h1>
  @if(isAdmin)
    <button>Admin Panel</button>
  @end
`;

const html = await kire.render(template, {
  name: 'World',
  isAdmin: true
});

console.log(html);
```

## License

MIT
