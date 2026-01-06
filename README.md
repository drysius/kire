# Kire - A Powerful and Flexible Template Engine

Kire is a modern, lightweight, and extensible template engine for JavaScript and TypeScript. It is designed to be intuitive, supporting advanced features like namespaces, dynamic mounting, layout inheritance, and a robust plugin system.

## Features

- **Intuitive Syntax**: Use `{{ variable }}` for interpolation and `@directive` for control flow.
- **Namespaces & Mounts**: Organize your templates with namespaces (`@include('theme.header')`) and mount dynamic data to them.
- **Layouts & Slots**: Powerful component-based architecture with `@component`, `@slot`, and layouts.
- **Extensible**: Create custom directives and elements easily.
- **Async Support**: First-class support for asynchronous operations in templates.
- **Source Mapping**: Detailed error reporting with snippets pointing to the exact line in your template.
- **TypeScript Ready**: Written in TypeScript for excellent type safety.

## Installation

```bash
npm install kire
# or
bun add kire
```

## Quick Start

```javascript
import { Kire } from 'kire';
import { join } from 'path';

const kire = new Kire();

// Register a namespace pointing to a directory
kire.namespace('views', join(__dirname, 'views'));

// Render a template string
const output = await kire.render('Hello {{ name }}!', { name: 'Kire' });
console.log(output);

// Render a file from a namespace
// resolving to: /path/to/views/home.kire
const fileOutput = await kire.view('views.home', { title: 'Home Page' });
```

## Core Concepts

### Namespaces and Path Resolution

Kire uses a namespace system instead of a single root directory. This allows you to organize templates into modules, themes, or plugins.

```javascript
// Register namespaces
kire.namespace('~', process.cwd()); // Root
kire.namespace('theme', './themes/{name}'); // Dynamic path with placeholder

// Mount data for placeholders
kire.mount('theme', { name: 'dark' });

// In your template:
// Loads ./themes/dark/header.kire
@include('theme.header')
```

## Directives

Kire comes with a rich set of built-in directives.

### Control Flow
- `@if(condition) ... @elseif(cond) ... @else ... @end`
- `@switch(value) ... @case(val) ... @default ... @end`
- `@for(item of items) ... @end`

### Variables
- `@const(name = value)`: Define a constant.
- `@let(name = value)`: Define a variable.

### Includes & Components
- `@include('namespace.path', { ...locals })`: Include another template.
- `@component('namespace.path', { ...props }) ... @end`: Render a component with slots.
- `@slot('name') ... @end`: Define a slot content within a component.

### Layouts
- `@define('blockName') ... @end`: Define content for a block.
- `@defined('blockName')`: Render the defined content.
- `@stack('name')`: Define a stack insertion point.
- `@push('name') ... @end`: Push content to a stack.

## API Reference

### `kire.namespace(prefix, path)`
Registers a namespace. `path` can contain placeholders like `{key}`.

### `kire.mount(prefix, data)`
Mounts data to a namespace to resolve its placeholders.

### `kire.view(path, locals)`
Renders a template file. `path` can use dot notation (`views.home`) which resolves relative to registered namespaces.

### `kire.render(templateString, locals)`
Renders a raw string.

### `kire.element(name, handler)`
Registers a custom HTML-like element handler.

## License

MIT