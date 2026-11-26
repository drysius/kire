# create-kire

Scaffold a new [Kire](https://github.com/drysius/kire) app — pick a framework
template and TypeScript or JavaScript.

```bash
npm create kire@latest
# or
bun create kire
# or
npx create-kire my-app
```

## Non-interactive

```bash
npx create-kire my-app --template express --ts
npx create-kire my-app -t hono --js
```

Flags: `--template <id>` / `-t`, `--ts` / `--js` (or `--language <ts|js>`).

## Templates

Each template is a small styled app (Tailwind via CDN) with a home page, a
dotted-path view, a reactive Kirewire counter and a directive showcase.

| Template | Stack |
|---|---|
| `express` | Express + `@kirejs/express` |
| `fastify` | Fastify + `@kirejs/fastify` |
| `elysia` | Elysia (Bun) + `@kirejs/elysia` |
| `koa` | Koa + `@kirejs/koa` |
| `hono` | Hono + `@kirejs/hono` |
| `h3` | h3 (unjs) + `@kirejs/h3` |

Every template ships in both **TypeScript** and **JavaScript**. The TypeScript
variant uses the `@Component` / `@prop` decorators; the JavaScript variant
registers components with `ownMeta(Counter).name = "..."` (no decorators, no
build step).

## Adding a template

Drop a folder under `templates/<id>/` with a `meta.json` (`{ title, description }`),
a `shared/` directory (copied verbatim — put `views/`, `README.md`, `gitignore`
there) and `ts/` and/or `js/` directories (copied over `shared/`). The CLI
discovers it automatically.

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide.
