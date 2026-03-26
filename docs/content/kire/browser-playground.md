---
route: "/docs/kire/browser-playground"
title: "Browser Runtime and Playground"
description: "Use kire/browser with virtual files, namespaces and inline rendering, and test real templates directly inside the documentation."
tags: ["browser", "playground", "virtual files", "kire/browser", "sandbox", "docs"]
section: "Kire Essentials"
order: 3
---

# Browser Runtime and Playground

Kire also ships a browser-safe entrypoint:

```ts
import { Kire } from "kire/browser";
```

This runtime swaps the default platform implementation so you can render templates in the browser without Node filesystem APIs.

## What `kire/browser` is good for

- interactive documentation
- local playgrounds and visual sandboxes
- in-browser demos for plugins and components
- unit-like template experiments using virtual files

## What changes in browser mode

- file access comes from the `files` option instead of the real disk
- `root` and `namespace()` still work, but they resolve against virtual paths
- `view()` works if the target path exists in your in-memory file map
- `render()` still compiles a raw template string directly

## Minimal example

```ts
import { Kire } from "kire/browser";

const kire = new Kire({
  root: "/",
  files: {
    "/views/home.kire": "<h1>{{ title }}</h1>"
  }
});

kire.namespace("views", "/views");

const html = await kire.view("views.home", {
  title: "Running in the browser"
});
```

## Inline template example

```ts
const html = await kire.render(`
  <section>
    @if(user)
      <h2>Hello {{ user.name }}</h2>
    @else
      <h2>Guest</h2>
    @end
  </section>
`, {
  user: { name: "Daniel" }
});
```

## Live playground

The sandbox below uses the real `kire/browser` bundle. It supports:

- Monaco editors for the template and JSON inputs
- `kire.render()` for the template editor
- `kire.view()` for virtual files and namespaces
- JSON locals
- JSON virtual files so you can test `@layout`, `@include` and `x-*`

<div data-kire-browser-playground data-preset="starter" class="kire-browser-playground">
  <div class="kire-browser-playground__hero">
    <strong>Interactive `kire/browser` sandbox</strong>
    <p>Edit the template, locals and virtual files with Monaco. The right panel renders the result immediately.</p>
  </div>

  <div class="kire-browser-playground__body">
    <div class="kire-browser-playground__toolbar">
      <div class="kire-browser-playground__modes">
        <button type="button" class="btn btn-sm kire-browser-playground__mode" data-action="mode" data-mode="view" aria-pressed="true">Run `view()`</button>
        <button type="button" class="btn btn-sm kire-browser-playground__mode" data-action="mode" data-mode="render" aria-pressed="false">Run `render()`</button>
        <button type="button" class="btn btn-sm btn-ghost" data-action="reset">Reset preset</button>
      </div>

      <label class="kire-browser-playground__toggle">
        <input type="checkbox" data-role="autorun" checked />
        Auto render while typing
      </label>
    </div>

    <div class="kire-browser-playground__status" data-role="status"></div>

    <div class="kire-browser-playground__grid">
      <section class="kire-browser-playground__panel kire-browser-playground__stack">
        <div class="kire-browser-playground__field">
          <label class="kire-browser-playground__label" for="kire-browser-view-path">View path</label>
          <input id="kire-browser-view-path" class="kire-browser-playground__input" data-role="view-path" value="views.playground" />
        </div>

        <div class="kire-browser-playground__field">
          <label class="kire-browser-playground__label" for="kire-browser-template">Template</label>
          <textarea id="kire-browser-template" class="kire-browser-playground__textarea" data-role="template"></textarea>
        </div>

        <div class="kire-browser-playground__field">
          <label class="kire-browser-playground__label" for="kire-browser-locals">Locals JSON</label>
          <textarea id="kire-browser-locals" class="kire-browser-playground__textarea" data-role="locals"></textarea>
        </div>

        <div class="kire-browser-playground__field">
          <label class="kire-browser-playground__label" for="kire-browser-files">Virtual files JSON</label>
          <textarea id="kire-browser-files" class="kire-browser-playground__textarea" data-role="files"></textarea>
        </div>
      </section>

      <section class="kire-browser-playground__panel kire-browser-playground__stack">
        <div>
          <p class="kire-browser-playground__caption">Rendered preview</p>
          <iframe class="kire-browser-playground__preview" data-role="preview" sandbox=""></iframe>
        </div>

        <div>
          <p class="kire-browser-playground__caption">HTML output</p>
          <pre data-code-lang="html"><code class="language-html" data-role="output"></code></pre>
        </div>
      </section>
    </div>

    <p class="kire-browser-playground__hint">
      Tip: in <code>view()</code> mode the sandbox writes the template editor into <code>/views/playground.kire</code>, so the JSON file map only needs your extra layouts and components.
    </p>
  </div>
</div>

## Virtual files pattern

When you want layouts and components in the browser, treat `files` as a small in-memory project:

```ts
const files = {
  "/layouts/app.kire": "<main>@yield(\"content\")</main>",
  "/components/ui/badge.kire": "<span>{{ label }}</span>",
  "/views/home.kire": `
    @layout("layouts.app")
      @slot("content")
        <x-ui/badge label="{{ role }}"></x-ui/badge>
      @end
    @end
  `,
};
```

Then register the same namespaces you would use on the server:

```ts
kire.namespace("layouts", "/layouts");
kire.namespace("components", "/components");
kire.namespace("views", "/views");
```

## Code blocks in the docs

If you want Kire syntax highlighted inside the documentation markdown, use fenced code blocks with the `kire` language. The docs site registers a dedicated `highlight.js` grammar for Kire, so directives, interpolations and HTML all render with the same syntax rules:

````md
```kire
@if(user)
  <p>Hello {{ user.name }}</p>
@end
```
````

That is the format used throughout this docs site.
