# Kire Core

This is the generic core of the **Kire** template engine. It provides the foundation for parsing, compiling, and executing templates while remaining agnostic about specific directive or element logic.

## 🏗️ Architecture

Kire operates in three main stages:

1.  **Parser**: Scans the template string and generates a typed AST (Abstract Syntax Tree). It handles interpolation `{{ }}`, directives `@`, and elements `<tag>`.
2.  **Compiler**: Transforms the AST into highly optimized JavaScript code. It performs identifier collection for automatic variable declaration and integrates source maps.
3.  **Runtime**: Executes the compiled JS functions. It manages the context (`$props`, `$globals`, `$kire`), request isolation (`fork`), and error mapping.

## 🧩 Developing Plugins

The core doesn't know what `@if` or `<x-button>` means. These are provided by plugins (like the built-in `KireDirectives`).

### Creating a Plugin
```typescript
import { Kire, KirePlugin } from 'kire';

export const MyPlugin: KirePlugin = {
    name: 'my-custom-logic',
    load(kire: Kire) {
        // Register a directive
        kire.directive({
            name: 'uppercase',
            onCall(api) {
                const arg = api.getArgument(0);
                api.write(`$kire_response += String(${arg}).toUpperCase();`);
            }
        });

        // Register an element
        kire.element({
            name: 'my-tag',
            onCall(api) {
                api.append('<div>');
                api.renderChildren();
                api.append('</div>');
            }
        });
    }
};
```

## 🛠️ Core API for Plugin Authors

### `api.write(jsCode)`
Injects raw JavaScript into the generated function's body. Use this for control flow (if, for).

### `api.append(content)`
Appends static string content to the output buffer. If a non-string is passed, it generates `$kire_response += content;`.

### `api.prologue(jsCode)`
Injects code at the beginning of the generated function (e.g., variable initialization).

### `api.epilogue(jsCode)`
Injects code at the end of the generated function, just before the return.

### `api.getAttribute(name)`
Retrieves an attribute value from an element or a parameter from a directive, automatically handling interpolation.

### `api.depend(path)`
Registers a dependency on another template and returns its internal identifier.

## ⚡ Performance Optimization

Kire Core is built for speed:
- **NullProtoObj**: Uses `Object.create(null)` for all internal maps/stores to avoid prototype chain overhead and security risks.
- **Fast Matchers**: Uses pre-compiled, length-sorted regex patterns for element and directive detection.
- **Lazy Resolution**: Dependencies are resolved only during execution, not compilation.

## 🧪 Testing

We use **Bun:test** for our test suite. To run core tests:
```bash
bun test core/tests
```

## License

MIT
