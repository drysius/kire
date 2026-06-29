---
route: "/docs/wire/security"
title: "Security & Synthesizers"
description: "How Kirewire stays safe: HMAC-signed snapshots, method gating, mass-assignment protection, the synth allowlist, and how rich types travel over the wire."
tags: ["wire", "security", "checksum", "synthesizers", "locked"]
section: "Kirewire"
order: 10
---

# Security & Synthesizers

State lives on the server and the client is untrusted, so every boundary is
checked. Always set a strong, stable `secret`:

```ts
const wire = new Kirewire({ secret: process.env.APP_SECRET! });
```

## Signed snapshots

Each snapshot is signed with HMAC-SHA256 over its state (`secret` keyed). On every
request the server verifies the signature in constant time **before** any
hydration. A tampered or forged snapshot is rejected with `419` — no detail is
leaked about why. `memo.children` is excluded from the signature so the client may
legitimately add/remove nested components.

## Method gating

Only safe methods are callable from the browser:

- `_` / `$`-prefixed methods are blocked.
- Reserved names (`render`, `view`, `mount`, `boot`, …) are blocked.
- By default only methods declared on **your** subclass are callable.
- Add `@action` to switch to an explicit allowlist.

## Mass-assignment protection

`wire:model` / `$set` may only write declared `@prop` properties. `@locked`
properties reject client writes outright, and `@validate` rules run on update.
Anything else is ignored.

## Synthesizers

Primitives travel as-is. Anything richer (`Date`, `Map`, `Set`, `BigInt`, nested
objects/arrays, and your own classes) is serialized by a **synthesizer** into a
`[value, { s }]` tuple and reconstructed on the other side. The built-ins are
registered by default.

### Custom types

Register a synth for your own classes — gated by an **allowlist** so untrusted
payloads can only revive types you opted in:

```ts
import { modelSynth, defineSynth, SynthRegistry } from "@kirejs/wire";

class Money { constructor(public cents = 0, public currency = "USD") {} }

wire.synth.register(modelSynth("money", Money));        // plain data classes

// or full control:
wire.synth.register(defineSynth({
  key: "money",
  match: (v) => v instanceof Money,
  dehydrate: (m) => [{ cents: m.cents, currency: m.currency }, {}],
  hydrate: (d) => new Money(d.cents, d.currency),
}));
```

When constructing a registry with an allowlist, only listed keys may hydrate:

```ts
import { createDefaultSynthRegistry } from "@kirejs/wire";
const synth = createDefaultSynthRegistry((key) => ["money", "obj", "arr"].includes(key));
const wire = new Kirewire({ secret, synth });
```

## Checklist

- Set a strong `secret`; keep it out of source control.
- Validate the CSRF `token` in your transport layer.
- Mark trust-sensitive properties `@locked`.
- Keep the synth allowlist tight in production.
- Never trust the client snapshot's state — it is re-derived and re-signed every
  request.
