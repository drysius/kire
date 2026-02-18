# Kire - Ultra-Fast JIT Template Engine for JavaScript

Kire is a high-performance, generic, and extensible template engine inspired by **Blade** (Laravel) and **Edge.js** (AdonisJS). It compiles templates directly into optimized JavaScript functions, offering near-native performance with an intuitive and expressive syntax.

## ✨ Features

- **JIT Compilation**: Templates are compiled to pure JS functions for maximum execution speed.
- **Intuitive Syntax**: Use `{{ expr }}` for interpolation and `@directive` for control flow.
- **Namespaces**: Organize templates into logical modules or directories.
- **Component-Based**: Native support for components and slots using `@component` or `<x-tag>`.
- **Request Isolation**: Use `kire.fork()` to safely handle per-request context in web servers.
- **Extensible Architecture**: The core is generic; all logic (directives, elements) is provided via a modular plugin system.
- **Async & Sync**: Intelligent detection of `await` to switch between sync and async execution.
- **First-Class Error Reporting**: Integrated source maps point exactly to the template line that caused an error.

## 📦 Installation

```bash
npm install kire
# or
bun add kire
```

## 🚀 Quick Start

```typescript
import { Kire } from 'kire';

const kire = new Kire();

// Render a raw string
const output = await kire.render('Hello {{ name }}!', { name: 'Kire' });
console.log(output);

// Use a layout and component
const template = `
    @layout('base')
        @slot('content')
            <x-alert type="'success'">
                Operation completed!
            </x-alert>
        @endslot
    @endlayout
`;
```

## 🔑 Core Concepts

### Local Variables & `$props`
By default, all data passed to `render` is available via the `it` or `$props` aliases.
```html
<h1>{{ it.title }}</h1>
<p>{{ $props.content }}</p>
```
You can customize the local variable name in the constructor:
```typescript
const kire = new Kire({ local_variable: 'data' }); // Use {{ data.title }}
```

### Namespaces & Path Resolution
Organize your views across multiple directories.
```typescript
kire.namespace('admin', './views/admin');
kire.namespace('shared', './views/shared');

// Resolves to ./views/admin/dashboard.kire
await kire.view('admin.dashboard');
```

### Request Isolation (`fork`)
Crucial for web servers (Hono, Express, etc.). A fork shares the template cache but has isolated global state.
```typescript
app.get('/profile', async (c) => {
    const requestKire = kire.fork();
    requestKire.$global('auth', c.get('user'));
    
    return c.html(await requestKire.view('profile'));
});
```

### Virtual Files (`files`)
Load templates from memory or pre-compiled bundles.
```typescript
const kire = new Kire({
    files: {
        'button.kire': '<button>{{ label }}</button>'
    }
});
```

## 🛠️ Directives & Elements

### Control Flow
- `@if(cond) ... @elseif(cond) ... @else ... @end`
- `@switch(expr) ... @case(val) ... @default ... @end`
- `@for(item of items) ... @end`
- `@unless(cond) ... @end`
- `@isset(var) ... @end`

### Stacks & Layouts
- `@stack('name')` / `@push('name')`
- `@yield('name', default)` / `@slot('name')`
- `@define('name')` / `@defined('name')`

### Native Elements
Kire supports HTML-like elements for logic:
```html
<kire:if cond="user.isLogged">
    <x-user-menu />
</kire:if>
```

## 🧩 Plugin System

Kire is designed to be extended. You can add your own directives and elements.

```typescript
kire.plugin({
    name: 'my-plugin',
    load(kire) {
        kire.directive({
            name: 'hello',
            onCall(api) {
                api.append('Hello from Directive!');
            }
        });
    }
});
```

## 🎓 VS Code Extension

Install the official extension for syntax highlighting and autocompletion:
👉 **[Kire Intellisense](https://marketplace.visualstudio.com/items?itemName=Kire.kire-intellisense)**

## License

MIT
