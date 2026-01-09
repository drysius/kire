# @kirejs/node

Node.js integration bindings for the Kire template engine. This package provides essential utilities for running Kire in a server-side Node.js environment, such as file system resolvers.

## Features

- **File System Resolver**: Automatically resolves and loads templates from disk.
- **Path Resolution**: Handles aliases and namespaced views (e.g., `views.home`).
- **Production Caching**: optimized caching strategies for high-performance server rendering.

## Installation

```bash
npm install @kirejs/node
# or
bun add @kirejs/node
```

## Usage

```typescript
import { Kire } from 'kire';
import { KireNode } from '@kirejs/node';

const kire = new Kire();
kire.plugin(KireNode);

// Now you can load views from the filesystem
const html = await kire.view('pages.index', { title: 'Home' });
```

## License

MIT
