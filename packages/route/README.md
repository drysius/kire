# @kirejs/route

A Laravel-like `Route` helper plugin for Kire templates.

## Installation

```bash
npm install @kirejs/route
```

## Usage

Register the plugin in your Kire instance:

```typescript
import { Kire } from 'kire';
import KireRoute, { Route } from '@kirejs/route';

const kire = new Kire();
kire.plugin(KireRoute);

// Per-request setup (e.g., in Express middleware)
Route.set('/admin/dashboard', 'admin.dashboard');

const html = await kire.render(`
  @if(Route.is('admin.*'))
    <h1>Admin Area</h1>
  @endif
`);
```

## API

### `Route.is(pattern: string): boolean`
Checks if the current request URI matches a given pattern. Strings may use wildcards (*).

### `Route.current(): string`
Get the current request URI.

### `Route.currentRouteName(): string | null`
Get the name of the current route.
