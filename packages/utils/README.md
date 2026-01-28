# @kirejs/utils

A collection of Laravel-like utilities (`Route`, `Html`, `Str`, `Arr`, etc.) for Kire templates.

## Installation

```bash
npm install @kirejs/utils
```

## Usage

Register the plugin in your Kire instance:

```typescript
import { Kire } from 'kire';
import KireUtils from '@kirejs/utils';

const kire = new Kire();
kire.plugin(KireUtils);

// Per-request setup (e.g., in Express middleware) using fork()
const fkire = kire.fork();

// Initialize utilities for this request
fkire.route(new URL('http://localhost/admin/dashboard'), 'admin.dashboard');

const html = await fkire.render(`
  @if(Route.is('admin.*'))
    <h1>Admin Area</h1>
  @endif

  <!-- Using Html Helper -->
  {{{ Html.style('css/app.css') }}}
  {{{ Html.script('js/app.js') }}}
  
  <!-- URL Helper -->
  <a href="{{ url('profile') }}">Profile</a>
  
  <!-- Str Helper -->
  <p>{{ Str.limit(description, 50) }}</p>
`);
```

## API

### `kire.route(url: string | URL, name?: string): this`
Initializes the `Route` and `Html` helpers for the current Kire instance (usually a fork).

### Template Helpers

#### `Route`
- **`Route.is(pattern: string | RegExp): boolean`**: Checks if the current request URI matches a given pattern. Supports wildcards (*) or Regex objects.
- **`Route.current(): string`**: Get the current request URI path.
- **`Route.url(): string`**: Get the full URL.
- **`Route.to(path): string`**: Generate absolute URL.
- **`Route.currentRouteName(): string | null`**: Get the name of the current route.

#### `Html`
- **`Html.style(href, attrs)`**: Generates `<link rel="stylesheet">`.
- **`Html.script(src, attrs)`**: Generates `<script>`.
- **`Html.image(src, alt, attrs)`**: Generates `<img>`.
- **`Html.favicon(href)`**: Generates favicon link.
- **`Html.meta(attrs)`**: Generates `<meta>` tag.
- **`Html.link(href, text, attrs)`**: Generates `<a>`.

#### `Str`
- **`Str.limit(string, limit, end)`**
- **`Str.slug(string)`**
- **`Str.title(string)`**
- **`Str.lower(string)`**
- **`Str.upper(string)`**
- **`Str.contains(string, needles)`**

#### `Arr`
- **`Arr.get(array, key, default)`**: Dot notation access.
- **`Arr.has(array, key)`**
- **`Arr.random(array)`**
- **`Arr.wrap(value)`**

#### Context Functions
- **`url(path)`**: Generates an absolute URL.
- **`old(key, default)`**: Retrieves old input (flashed data).
