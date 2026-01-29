# @kirejs/wire

**KireWire** is a full-stack library for Kire that makes building dynamic interfaces simple, without leaving the comfort of your server-side language. Inspired by Laravel Livewire.

## 🧩 VS Code Extension

For the best development experience, including syntax highlighting and autocomplete for Kire and Wire directives, install the official VS Code extension:
👉 **[Kire Intellisense](https://marketplace.visualstudio.com/items?itemName=Kire.kire-intellisense)**

## ✨ Features

- **Server-Driven UI**: Write logic in TypeScript/JavaScript classes on the server; the view updates automatically.
- **Data Binding**: Real-time data synchronization with `wire:model`.
- **Actions**: Trigger server methods directly from HTML events using `wire:click`, `wire:submit`, etc.
- **SPA Navigation**: Built-in SPA-like navigation with `wire:navigate`.
- **State Management**: Automatic state hydration/dehydration between requests.
- **Defer & Lazy Loading**: Smart modifiers like `.defer` to optimize network traffic.
- **Framework Agnostic Adapters**: Adapters for **HTTP**, **WebSockets**, and **FiveM**.

## 📦 Installation

```bash
npm install @kirejs/wire kire
# or
bun add @kirejs/wire kire
```

## 🚀 Quick Start

### 1. Create a Component

Components are classes extending `WireComponent`. Public properties are automatically synced with the frontend.

```typescript
// components/Counter.ts
import { WireComponent } from '@kirejs/wire';

export default class Counter extends WireComponent {
    public count = 0;

    increment() {
        this.count++;
    }

    render() {
        return `
            <div>
                <h1>Count: {{ count }}</h1>
                <button wire:click="increment">+</button>
            </div>
        `;
    }
}
```

### 2. Register and Use

```typescript
import { Wired } from '@kirejs/wire';
import Counter from './components/Counter';

// Register the component
Wired.register('counter', Counter);

// Use it in your Kire template
// @wire('counter')
```

## 🛠️ Backend Setup

To make KireWire work, you must define a POST endpoint in your server to handle component updates.

### 1. Configure the Plugin
Initialize Wired with a route, adapter, and a secret key for checksums.

```typescript
import { Wired } from '@kirejs/wire';

kire.plugin(Wired.plugin, {
    route: "/_wired",
    adapter: "http",
    secret: "some-very-secret-string",
});
```

### 2. Create the POST Endpoint (Elysia/Hono example)
Your server needs to listen for POST requests on the configured route and delegate them to `Wired.payload`.

```typescript
app.post("/_wired", async (context) => {
    const { body, set } = context;
    
    // 1. Validate the payload structure
    if (Wired.validate(body)) {
        // 2. Process the request
        // 'wireKey' should be a unique identifier for the user (e.g., session ID)
        const result = await Wired.payload(context.wireKey, body);
        
        set.status = result.code;
        return result.data;
    }
    
    set.status = 400;
    return Wired.invalid;
});
```

### 3. Initial Rendering
When rendering a page that contains KireWire components, you should pass a `$wireToken`. This token acts as a salt for the component's checksum, ensuring that only the user who rendered the component can mutate its state.

```typescript
app.get("/", async (context) => {
    return await kire.view("pages.index", {
        $wireToken: context.wireKey, // Must match the key passed to Wired.payload later
    });
});
```

## 📚 API Reference

### Core Directives

- **`@wire(name, params?, options?)`**: Renders a component.
  - `name`: Component name.
  - `params`: Initial parameters (object).
  - `options`: `{ lazy: true }` for lazy loading.
- **`@live(name, params?, options?)`**: Alias for `@wire`.
- **`@wired` / `@wiredScripts`**: Injects necessary client-side scripts.

### Wire Attributes

Events and data binding for your HTML elements.

- **`wire:model`**: Two-way data binding. Modifiers: `.live`, `.debounce.Xms`.
- **`wire:click`**: Trigger click action. Modifiers: `.prevent`, `.stop`.
- **`wire:submit`**: Trigger submit action. Modifiers: `.prevent`.
- **`wire:keydown` / `wire:keyup`**: Keyboard events. Modifiers: `.enter`, `.escape`, etc.
- **`wire:mouseenter` / `wire:mouseleave`**: Mouse events.
- **`wire:init`**: Run action on component initialization.
- **`wire:poll`**: Poll server at intervals. Modifiers: `.2s`, `.keep-alive`, `.visible`.
- **`wire:loading`**: Toggle visibility during loading. Modifiers: `.class`, `.attr`, `.remove`.
- **`wire:target`**: Scope loading to specific actions.
- **`wire:dirty`**: Show element when state is dirty (unsaved).
- **`wire:offline`**: Show element when offline.
- **`wire:ignore`**: Ignore DOM updates for this element (useful for 3rd party libs).
- **`wire:key`**: Unique key for DOM diffing.
- **`wire:id`**: Internal component ID.
- **`wire:navigate`**: SPA-like navigation for links.
- **`wire:confirm`**: Confirmation dialog before action.
- **`wire:stream`**: Enable streaming updates.

### Alpine.js Integration

KireWire works seamlessly with Alpine.js. Common attributes supported:

- `x-data`, `x-init`, `x-show`, `x-bind`, `x-on`, `x-text`, `x-html`, `x-model`, `x-for`, `x-if`, `x-effect`, `x-ignore`, `x-ref`, `x-cloak`, `x-teleport`, `x-id`, `x-transition`.

## License

MIT