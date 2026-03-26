# @kirejs/markdown

`@kirejs/markdown` renders Markdown content inside Kire.

## What It Adds

- `@markdown(source)` for Markdown strings, files, or glob patterns
- `@mdslots(pattern, name)` for preloading Markdown collections into a variable
- file and glob resolution relative to the Kire root
- protection for Kire syntax inside code blocks

## Typical Usage

```ts
import { Kire } from "kire";
import KireMarkdown from "@kirejs/markdown";

const kire = new Kire({ root: "content" }).plugin(KireMarkdown);
```

```kire
@markdown("# Hello")
@markdown("posts/intro.md")
@markdown("posts/*.md")

@mdslots("posts/*.md", "posts")
```

The plugin registers directive metadata used by `KIRE IntelliSense`, including examples and descriptions for the Markdown helpers.

## License

MIT
