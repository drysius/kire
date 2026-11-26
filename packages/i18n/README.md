# @kirejs/i18n

Localization: @lang, @choice and __() / trans() / trans_choice() with placeholders and Laravel-style pluralization.

```bash
npm install @kirejs/i18n
```

```ts
import { KireI18n } from "@kirejs/i18n";

kire.plugin(KireI18n, { locale: "pt", fallback: "en", translations: { pt: { msg: { hi: "Olá, :name!" } } } });
// template: @lang("msg.hi", { name: user.name })
```

> **AI agents:** see [AGENT.md](./AGENT.md) for a focused guide, and the repository root `CLAUDE.md`.
