# Elysia + Kire example

Minimal Elysia app using [`@kirejs/elysia`](../../packages/elysia).

```bash
bun run main.ts
# open http://localhost:3000
```

```ts
import { Elysia } from "elysia";
import { kireElysia } from "@kirejs/elysia";

new Elysia()
  .use(kireElysia({ views: "views" }))
  .get("/", ({ view }) => view("home", { title: "Hi" }))
  .get("/about", ({ view }) => view("pages.about"))
  .listen(3000);
```

`kireElysia` decorates the context with `view(name, data)` (renders a dotted
Kire view to an HTML `Response`) and `kire` (the engine).

### Kirewire (optional)

```ts
const wire = new Kirewire({ secret: process.env.APP_SECRET! });
wire.component(Counter);
app.use(kireElysia({ views: "views", wire: { instance: wire } }));
```

The update endpoint is mounted and the client runtime is auto-served.
