# @kirejs/express

Express integration: Kire as the view engine plus a typed res.view().

```bash
npm install @kirejs/express
```

```ts
import { kireExpress } from "@kirejs/express";

app.use(kireExpress({ views: "views", wire: { instance: wire } }));
app.get("/", (_q, res) => res.render("home"));
app.get("/about", (_q, res) => res.view("pages.about"));
```

### WebSocket transport (optional)

Enable the duplex WebSocket transport with `wire.ws`. Express doesn't own its
server, so pass the Node `http.Server` and install [`ws`](https://www.npmjs.com/package/ws).
The injected client script then connects over WebSocket automatically. Without a
`server` it logs a warning and stays on HTTP.

```ts
import { createServer } from "node:http";
const app = express();
app.use(express.json());
const server = createServer(app);
app.use(kireExpress({ views: "views", wire: { instance: wire, ws: { server } } }));
server.listen(3000);
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
