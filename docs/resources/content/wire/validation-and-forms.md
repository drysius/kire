---
route: "/docs/wire/validation-and-forms"
title: "Validation & Forms"
description: "Per-property validation with @validate, the $errors bag in views, and reusable WireForm objects with validate() and reset()."
tags: ["wire", "validation", "forms", "validate", "errors"]
section: "Kirewire"
order: 5
---

# Validation & Forms

## Per-property validation

Attach a rule to a property with `@validate`. It runs whenever the property is
written from the client. A rule is either a predicate (`null` = valid, string =
error message) or a schema with `safeParse` (Zod-compatible):

```ts
@Component("signup")
export class Signup extends LiveComponent {
  @validate((v) => (/.+@.+/.test(String(v)) ? null : "Invalid email"))
  @prop email = "";

  @validate(z.string().min(8, "At least 8 chars"))
  @prop password = "";
}
```

## The `$errors` bag

Validation messages are collected into `$errors`, exposed to the view and sent to
the client as an effect:

```html
<input wire:model.live="email" />
@if($errors.email)
  <p class="text-error text-sm">{{ $errors.email }}</p>
@end
```

When a property becomes valid, its error is cleared automatically.

## Form objects

For multi-field forms, group fields into a `WireForm`. Fields are plain reactive
properties; `@validate` on them drives `validate()`:

```ts
import { WireForm, validate } from "@kirejs/wire";

class CreatePostForm extends WireForm {
  @validate((v) => (String(v).length >= 3 ? null : "Min 3 chars"))
  title = "";
  body = "";
}
```

Hold the form as a component property and register it as a synth so it serializes:

```ts
import { Kirewire, modelSynth } from "@kirejs/wire";

@Component("post-editor")
export class PostEditor extends LiveComponent {
  @prop form = new CreatePostForm();

  save() {
    if (!this.form.validate()) return;       // form.errors is now populated
    db.posts.insert({ ...this.form });
    this.form.reset();
  }

  render() { return this.view("components.post-editor"); }
}

const wire = new Kirewire({ secret });
wire.synth.register(modelSynth("createPost", CreatePostForm));
```

`wire:model="form.title"` writes straight through to the nested field — deep
dot-path navigation works on class instances.

### `WireForm` API

| Member | Purpose |
|---|---|
| `errors` | Field → message map, filled by `validate()`. |
| `validate()` | Run all `@validate` rules; returns `true` when valid. |
| `validateOrThrow()` | Throw `FormValidationError` when invalid. |
| `reset(...fields?)` | Clear fields (or all) and the error bag. |
