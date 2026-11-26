# Examples

Runnable examples of Kire in different setups. Each is standalone — run with Bun
from its folder (or from the repo root).

| Example | Shows |
|---|---|
| [`basic-example`](./basic-example) | Core engine usage, custom extensions/themes |
| [`express-example`](./express-example) | `@kirejs/express` — Kire as Express view engine + `res.view()` |
| [`fastify-example`](./fastify-example) | `@kirejs/fastify` — `reply.view()` |
| [`elysia-example`](./elysia-example) | `@kirejs/elysia` — context `view()` plugin |
| [`fivem-example`](./fivem-example) | Kirewire over the FiveM transport |

The server examples import the integration package from source
(`../../packages/<fw>/src`) so they run against this repo without a publish
step; in a real app you import the published name (e.g. `@kirejs/express`).

```bash
# from the repo root
bun run examples/express-example/main.ts
bun run examples/fastify-example/main.ts
bun run examples/elysia-example/main.ts
```
