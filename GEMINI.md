# Development Instructions for the Kire Project

## 1. Before Any Modification: Generate Context Files

Always before starting a code change, run the command below **at the workspace root** to generate the updated `llms.txt` files:

```bash
bun llms
```

This command scans the project and produces context files (such as `core/llms.txt`, `packages/*/llms.txt`, `vs-kire/llms.txt`) that contain essential information about the structure, dependencies, and documentation of each submodule. Keeping these files up to date is critical for you (or the AI) to have an accurate view of the code before modifying it.

## 2. Reading Context: Always Use the `llms.txt` Files

To understand any part of the project – whether it's the `core`, `vs-kire`, or a package under `packages/<name>` – **read the corresponding `llms.txt` file in its entirety** using the `read_tool`.

Example paths:

- `core/llms.txt`
- `vs-kire/llms.txt`
- `packages/<name>/llms.txt`

The `read_tool` should be configured to read up to **6000 lines** (or the entire file if smaller). This ensures you have all the necessary context, avoiding assumptions or omissions.

## 3. Core Genericity: Do Not Couple Specific Concepts

The `core/` directory contains the foundation of Kire and **must not directly reference concepts like "Directives" or "Elements"** in its code (parser, compiler, etc.). These terms are the responsibility of **plugins** that extend Kire.

### Why?
- Kire is designed to be **generic** and allow different plugins to adapt quickly, following well-defined patterns.
- Including these concepts in the core would make the system rigid and hinder the creation of new types of plugins.

### Best Practices:
- Keep the core free of mentions to "Directives" or "Elements".
- If abstractions are needed, use interfaces or generic types that can be implemented by plugins.
- Document only the contracts that plugins must follow in the core.

## 4. Performance: Prioritize Fast Structures and Low Allocation

Kire is built with a focus on **high performance**. Whenever possible, follow these principles:

- Use efficient data structures (e.g., `NullProtoObj` instead of `Map` for objects, unless more advanced handling requires `Map`; `Set` for fast lookups).
- Avoid unnecessary allocations – prefer reusing objects and arrays when safe.
- Measure the performance impact of changes, even informally (e.g., `console.time`).

## 5. Safe Development: Test Before Applying to Main Code

Never modify the main source code (`core/` or `packages/**/*`) without first validating the logic in an isolated environment.

### Recommended Workflow:

1. **Create a temporary test file** in the `.contexts/` folder (e.g., `.contexts/regex_test.ts`). This folder is intended for ephemeral debug scripts that should not be committed.
2. Write a code snippet there that exercises the new feature or fix.
3. Execute it with `bun .contexts/regex_test.ts` (or `bun run .contexts/regex_test.ts`) to verify the behavior is as expected.
4. Only after validation, integrate the logic into the main codebase.

Alternatively, you may use a `debug.ts` file in the relevant directory, but the `.contexts/` folder is preferred for keeping experiments separate.

### Automated Tests:
- For **new features** or **significant fixes**, write automated tests.
- Tests should reside in the appropriate directories:
  - `core/tests/` for changes in the core.
  - `packages/<name>/tests/` for changes in a specific package.
- Follow the existing test style in the project (using Bun:test).

## 6. Continuous Optimization and Code Quality

Beyond performance, always strive for a balance between **efficiency** and **clarity**. Optimized code doesn't have to be unreadable – use descriptive names, comment non‑obvious decisions, and maintain consistency with the rest of the project.

## 7. Understanding Kire Internals and Debugging

Kire is a template engine inspired by **Blade**, following a similar structure but implemented in TypeScript/JavaScript. It consists of a **compiler** and a **parser** that convert `.kire` template files into JavaScript functions, similar to Eta, EJS, Edge.js, etc.

When you encounter errors or need to understand what the compiler produces, use the following debugging techniques inside your `.contexts/test.ts` scripts:

- **Inspect the compiled JavaScript function:**
  ```typescript
  const compiled = kire.compile(templateString);
  console.log(compiled.toString());
  ```
  This prints the generated JavaScript code, allowing you to see exactly how the template is transformed.

- **Inspect the AST (Abstract Syntax Tree):**
  ```typescript
  const ast = kire.parse(templateString);
  console.log(JSON.stringify(ast, null, 2));
  ```
  This outputs the parsed AST structure, helping you understand how the template is broken down before compilation.

- **Test rendering with locals:**
  ```typescript
  const output = kire.render(templateString, locals);
  console.log(output);
  ```
  This executes the template with the provided data and prints the result.

These methods are invaluable for diagnosing issues and verifying that your changes produce the expected output. Always use them in your `.contexts/` debug files before modifying the main codebase.

## Final Guidelines:
- Review your code for performance bottlenecks (nested loops, many allocations).
- Prefer solutions that are fast **and** easy for other contributors to understand.
- Whenever in doubt about how the code should proceed, reread this `GEMINI.md` file.
- When implementing something new, ask yourself: "Does this follow Kire's generic philosophy? Is it optimized? Are the tests covering it?"