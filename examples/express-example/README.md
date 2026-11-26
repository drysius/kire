# Express + Kire example

Minimal Express app using [`@kirejs/express`](../../packages/express).

```bash
bun run main.ts
# open http://localhost:3000
```

## What it shows

```ts
import express from "express";
import { kireExpress } from "@kirejs/express";

const app = express();
app.use(kireExpress({ views: "views" })); // middleware style

app.get("/", (_req, res) => res.render("home", { title: "Hi" })); // view engine
app.get("/about", (_req, res) => res.view("pages.about"));        // dotted path helper
```

`kireExpress` registers Kire as Express's view engine (so `res.render` works like
EJS/Eta) and adds a typed `res.view(name, data)` for dotted view paths. The direct
form `const engine = kireExpress(app, { views })` is also available.

### Kirewire (optional)

Pass a `wire` option and everything is wired up — the update endpoint is mounted
and the client runtime is auto-served (no `clientScript` needed):

```ts
import { Kirewire } from "@kirejs/wire";

const wire = new Kirewire({ secret: process.env.APP_SECRET! });
wire.component(Counter);

app.use(express.json());
app.use(kireExpress({ views: "views", wire: { instance: wire } }));
```

In your layout, `@kirewireScripts` injects the client `<script>` and
`@wire("counter")` mounts a component.
