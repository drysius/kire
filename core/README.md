# Kire Core

The core engine of **Kire**, a powerful, expressive, and lightweight template engine for JavaScript/TypeScript environments. Kire is designed to be fast, extensible via plugins, and familiar to developers used to Blade (Laravel) or Edge (AdonisJS).

## 🧩 VS Code Extension

For the best development experience, syntax highlighting, and autocomplete, install the official VS Code extension:
👉 **[Kire Intellisense](https://marketplace.visualstudio.com/items?itemName=Kire.kire-intellisense)**

## ✨ Features

- **Expressive Syntax**: Clean and readable directives like `@if`, `@for`, `@each`, `@include`, `@component`.
- **Async Support**: First-class support for asynchronous operations within templates (e.g., `{{ await fetchData() }}`).
- **Streaming & Defer**: Built-in support for streaming responses and out-of-order rendering using `@defer`.
- **Components & Slots**: Modern component architecture with slot support and "Wire" capabilities (Livewire-like).
- **Extensible**: Robust plugin system to add custom directives, elements, and functionality.
- **Request Isolation**: Use `kire.fork()` to handle per-request context safely.
- **High Performance**: Compiles templates to efficient JavaScript functions.

## 📦 Installation

```bash
npm install kire
# or
bun add kire
```

## 🚀 Basic Usage

```typescript
import { Kire } from 'kire';

// Initialize Kire
const kire = new Kire({
  stream: false, // Enable streaming support (default: false)
  silent: false, // Suppress logs (default: false)
});

const template = `
  <h1>Hello, {{ it.name }}!</h1>
  
  @if(it.isAdmin)
    <button>Admin Panel</button>
  @else
    <button>User Settings</button>
  @end

  <ul>
    @each(user in it.users)
      <li>{{ user.name }}</li>
    @else
      <li>No users found.</li>
    @end
  </ul>
`;

const html = await kire.render(template, {
  name: 'World',
  isAdmin: true,
  users: [{ name: 'Alice' }, { name: 'Bob' }]
});

console.log(html);
```

## 🔑 Key Concepts

### Local Variables (`it`)
By default, all local variables passed to `render()` are accessible via the `it` object (e.g., `{{ it.title }}`). This prevents variable collisions and makes the source of data clear.
You can change this variable name in the options:
```typescript
const kire = new Kire({ varLocals: 'props' }); // Use {{ props.title }}
```

### Streaming & `@defer`
Kire supports HTML streaming, allowing you to send the initial page structure immediately and stream heavy content later.
```typescript
const kire = new Kire({ stream: true });

// In your template:
// Content inside @defer will be rendered asynchronously and injected later
// using a placeholder and a small script.
const tpl = `
  <nav>...</nav>
  @defer
    {{ await heavyDatabaseCall() }}
  @end
  <footer>...</footer>
`;
```

### Request Isolation (`fork`)
When building a web server (like with Hono, Express, or Elysia), you should use `kire.fork()` for each request. This creates a lightweight copy of the Kire instance that shares the cache but has its own global context (perfect for request-specific data like `auth` user, `request` object, etc.).

```typescript
app.get('/', (req, res) => {
  const requestKire = kire.fork();
  requestKire.$global('user', req.user);
  
  return requestKire.render('pages.dashboard');
});
```

### Directives
- **Control Flow**: 
  - `@if(cond)` / `@elseif(cond)` / `@elif(cond)` / `@else`
  - `@switch(expr)` / `@case(val)` / `@default`
- **Loops**: 
  - `@for(item of items)` / `@empty`
  - `@each(item in items)` / `@empty` (Alias for `@for`)
- **Variables**: `@const(name = val)`, `@let(name = val)`
- **Components & Layouts**: 
  - `@component('path', props)` / `@slot('name')`
  - `@layout('path')` / `@extends('path')` (Aliases for `@component`)
  - `@section('name')` (Alias for `@slot`)
  - `@yield('name', default)`
  - `@include('path', locals)`
- **Stacks**: `@push('stack')`, `@stack('stack')`
- **Blocks**: `@define('name')`, `@defined('name')`
- **Async**: `@defer` (requires streaming)
- **HTTP/Forms**: `@csrf`, `@method('PUT')`

## License

MIT