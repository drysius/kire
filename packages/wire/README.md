# @kirejs/wire

**KireWire** is a full-stack library for Kire that makes building dynamic interfaces simple, without leaving the comfort of your server-side language. Inspired by Laravel Livewire.

## Features

- **Server-Driven UI**: Write logic in TypeScript/JavaScript classes on the server; the view updates automatically.
- **Data Binding**: Real-time data synchronization with `wire:model`.
- **Actions**: Trigger server methods directly from HTML events using `wire:click`, `wire:submit`, etc.
- **State Management**: Automatic state hydration/dehydration between requests.
- **Defer & Lazy Loading**: Smart modifiers like `.defer` to optimize network traffic.
- **Framework Agnostic Adapters**: Adapters for **Elysia**, **Express**, **Fastify**, **Hono**, and **WebSockets**.

## Installation

```bash
npm install @kirejs/wire kire
# or
bun add @kirejs/wire kire
```

## Example

**Component (Counter.ts):**
```typescript
import { WireComponent } from '@kirejs/wire';

export default class Counter extends WireComponent {
    public count = 0;

    increment() {
        this.count++;
    }

    render() {
        return this.view('counter');
    }
}
```

**Template (counter.kire):**
```html
<div>
    <h1>Count: {{ count }}</h1>
    <button wire:click="increment">+</button>
</div>
```

## License

MIT
