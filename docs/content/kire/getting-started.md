# Getting Started with Kire

Kire is a template engine focused on speed, composability and predictable server rendering.
It compiles templates to JavaScript functions and caches them for reuse.

## Install

```bash
bun add kire
# or
npm install kire
```

## First Render

```ts
import { Kire } from "kire";

const kire = new Kire();
const html = await kire.render("<h1>Hello {{ name }}</h1>", {
  name: "Kire",
});
```

## View Files

```ts
const kire = new Kire({
  root: "./views",
});

const html = await kire.view("pages.home", {
  title: "Home",
});
```

`pages.home` resolves to `views/pages/home.kire`.

## Namespaces

Namespaces help split templates by domain.

```ts
kire.namespace("admin", "./views/admin");
kire.namespace("shared", "./views/shared");

await kire.view("admin.dashboard");
await kire.view("shared.card");
```

## Request Isolation with fork()

Use `fork()` in HTTP servers so each request has isolated globals while sharing compiled cache.

```ts
app.get("/", async (req) => {
  const k = kire.fork();
  k.$global("request", req);
  return await k.view("pages.home");
});
```

## Next Steps

- Read **How Kire Works** for internals and rendering lifecycle.
- Read **Directives Reference** for control flow and composition.
- Open **KireWire Playground** to see server-driven components.
