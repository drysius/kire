const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kire Browser Test</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #111827;
      --muted: #1f2937;
      --text: #e5e7eb;
      --ok: #10b981;
      --err: #ef4444;
    }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      background: radial-gradient(circle at 20% 0%, #1e293b, var(--bg));
      color: var(--text);
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
    }
    h1 { margin: 0 0 16px; font-size: 22px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .card {
      background: linear-gradient(180deg, #111827 0%, #0b1220 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px;
    }
    .label { font-size: 12px; opacity: 0.9; margin-bottom: 8px; display: block; }
    textarea {
      width: 100%;
      min-height: 220px;
      border: 1px solid #334155;
      border-radius: 10px;
      background: var(--muted);
      color: var(--text);
      padding: 10px;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 13px;
      resize: vertical;
    }
    .actions { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
    button { border: none; border-radius: 8px; padding: 9px 12px; cursor: pointer; font-weight: 600; }
    .primary { background: #0ea5e9; color: #07131f; }
    .secondary { background: #334155; color: #e2e8f0; }
    #status { margin-top: 10px; font-size: 13px; }
    #status.ok { color: var(--ok); }
    #status.err { color: var(--err); }
    #output {
      background: #ffffff;
      color: #111827;
      border-radius: 10px;
      padding: 12px;
      min-height: 160px;
      overflow: auto;
    }
    .hint { margin-top: 10px; font-size: 12px; opacity: 0.85; }
    code { background: rgba(255, 255, 255, 0.07); padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Kire Browser Runtime Test</h1>

  <div class="grid">
    <section class="card">
      <label class="label" for="template">Template (.kire)</label>
      <textarea id="template">&lt;section&gt;
  &lt;h2&gt;Hello {{ user.name }}&lt;/h2&gt;

  @if(user.isAdmin)
    &lt;p&gt;Role: admin&lt;/p&gt;
  @else
    &lt;p&gt;Role: guest&lt;/p&gt;
  @end

  &lt;ul&gt;
    @for(item of items)
      &lt;li&gt;{{ item }}&lt;/li&gt;
    @end
  &lt;/ul&gt;
&lt;/section&gt;</textarea>

      <label class="label" for="locals" style="margin-top: 10px;">Locals (JSON)</label>
      <textarea id="locals">{
  "user": { "name": "Daniel", "isAdmin": true },
  "items": ["alpha", "beta", "gamma"]
}</textarea>

      <div class="actions">
        <button class="primary" id="renderTemplate">Render kire.render()</button>
        <button class="secondary" id="renderView">Render kire.view()</button>
      </div>
      <div id="status"></div>
      <div class="hint">The <code>kire.view()</code> test uses virtual files in memory.</div>
    </section>

    <section class="card">
      <label class="label">Output HTML</label>
      <div id="output"></div>
    </section>
  </div>

  <script type="module">
    import { Kire } from "/kire.js";

    const status = document.getElementById("status");
    const output = document.getElementById("output");
    const templateEl = document.getElementById("template");
    const localsEl = document.getElementById("locals");

    const virtualFiles = {
      "/views/home.kire": \`
<section>
  <h2>Hello {{ user.name }}</h2>
  @if(user.isAdmin)
    <p>Role: admin</p>
  @else
    <p>Role: guest</p>
  @end
  <ul>
    @for(item of items)
      <li>{{ item }}</li>
    @end
  </ul>
</section>\`
    };

    const kire = new Kire({
      root: "/",
      files: virtualFiles,
      silent: false,
      production: false
    });

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.className = isError ? "err" : "ok";
    }

    function readLocals() {
      return JSON.parse(localsEl.value || "{}");
    }

    document.getElementById("renderTemplate").addEventListener("click", async () => {
      try {
        const locals = readLocals();
        const html = await kire.render(templateEl.value, locals);
        output.innerHTML = html;
        setStatus("Rendered with kire.render() successfully.");
      } catch (error) {
        console.error(error);
        setStatus(String(error?.message || error), true);
      }
    });

    document.getElementById("renderView").addEventListener("click", async () => {
      try {
        const locals = readLocals();
        const html = await kire.view("views/home", locals);
        output.innerHTML = html;
        setStatus("Rendered with kire.view() and virtual files successfully.");
      } catch (error) {
        console.error(error);
        setStatus(String(error?.message || error), true);
      }
    });
  </script>
</body>
</html>`;

const kireBrowserFile = Bun.file(new URL("./dist/browser/kire.js", import.meta.url));
const kireBrowserMapFile = Bun.file(new URL("./dist/browser/kire.js.map", import.meta.url));

const notFound = () => new Response("Not found", { status: 404 });

Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/") {
			return new Response(indexHtml, {
				headers: { "Content-Type": "text/html; charset=utf-8" },
			});
		}

		if (url.pathname === "/kire.js") {
			if (!(await kireBrowserFile.exists())) return notFound();
			return new Response(kireBrowserFile, {
				headers: { "Content-Type": "application/javascript; charset=utf-8" },
			});
		}

		if (url.pathname === "/kire.js.map") {
			if (!(await kireBrowserMapFile.exists())) return notFound();
			return new Response(kireBrowserMapFile, {
				headers: { "Content-Type": "application/json; charset=utf-8" },
			});
		}

		return notFound();
	},
});

console.log("Kire browser test server running at http://localhost:3000");
