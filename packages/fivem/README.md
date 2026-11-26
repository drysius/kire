# @kirejs/fivem

FiveM NUI integration — render NUI pages and answer updates via RegisterNuiCallback (no HTTP server).

```bash
npm install @kirejs/fivem
```

```ts
import { kireFivem } from "@kirejs/fivem";

const fivem = kireFivem({ views, wire: { instance: wire } });
RegisterNuiCallback(fivem.path, fivem.handler);
SendNuiMessage(JSON.stringify({ type: "page", html: await fivem.render("counter") }));
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
