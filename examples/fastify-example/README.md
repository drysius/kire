# Fastify + Kire example

Minimal Fastify app using [`@kirejs/fastify`](../../packages/fastify).

Serves `/`, `/about`, `/counter` (reactive Kirewire) and `/showcase` (directive demos + a live component viewer), styled with Tailwind via CDN.

```bash
bun run main.ts
# open http://localhost:3000
```

```ts
import Fastify from "fastify";
import { kireFastify } from "@kirejs/fastify";

const app = Fastify();
app.register(kireFastify({ views: "views" })); // plugin style

app.get("/", (_req, reply) => reply.view("home", { title: "Hi" }));
app.get("/about", (_req, reply) => reply.view("pages.about"));
```

`kireFastify` adds a typed `reply.view(name, data)` that renders a (dotted) Kire
view and sends it as HTML. The direct form `const engine = kireFastify(app, { views })`
also works.

### Kirewire (optional)

```ts
const wire = new Kirewire({ secret: process.env.APP_SECRET! });
wire.component(Counter);
app.register(kireFastify({ views: "views", wire: { instance: wire } }));
```

The update endpoint is mounted and the client runtime is auto-served. This
example includes a reactive counter at **`/counter`** (`counter.ts` +
`views/counter.kire`); build the client bundle once with
`bun run packages/wire/build.ts`.
