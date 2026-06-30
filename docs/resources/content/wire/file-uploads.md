---
route: "/docs/wire/file-uploads"
title: "File Uploads"
description: "Upload files with wire:model on a file input, the WireFile handle, pluggable FileStore, and how the upload endpoint and token resolution work."
tags: ["wire", "uploads", "files", "WireFile", "FileStore"]
section: "Kirewire"
order: 9
---

# File Uploads

A `wire:model` on `<input type="file">` uploads the chosen files to an upload
endpoint, then sets the bound property to a reference token. On the next request
the server resolves that token into a `WireFile` your action can read or persist.

## Client

```html
<input type="file" wire:model="photo" />
<input type="file" wire:model="gallery" multiple />
```

The runtime posts the files to the upload endpoint (`/_wire/upload` by default,
configurable via `start({ uploadUrl })`) and `$set`s the property to the returned
token(s). You can also drive it manually with `$wire.$upload(path, files)`.

## Server

Register the upload synth + feature with a `FileStore`, and serve an upload
endpoint:

```ts
import { Kirewire, MemoryFileStore, FileUploadSynth, FileUploadFeature } from "@kirejs/wire";

const store = new MemoryFileStore();           // swap for disk/S3 in production
const wire = new Kirewire({ secret });
wire.synth.register(new FileUploadSynth(store));
wire.features.register(new FileUploadFeature(store));
```

The `createFetchHandler({ store })` / `expressAdapter({ store })` adapters expose
the multipart upload route for you. Or call `handleUpload(store, files)` directly.

## Using the file in an action

```ts
import { WireFile } from "@kirejs/wire";

@Component("avatar")
export class Avatar extends LiveComponent {
  @prop photo: WireFile | null = null;

  async save() {
    if (!this.photo) return;
    await this.photo.store(`./uploads/${this.$id}.png`);   // persist to disk
    // or: const bytes = await this.photo.read();
  }

  render() { return this.view("components.avatar"); }
}
```

### `WireFile`

| Member | Purpose |
|---|---|
| `id`, `name`, `type`, `size` | File metadata. |
| `read()` | Read the raw bytes (`Uint8Array`). |
| `store(path)` | Persist to disk and return the path. |
| `toJSON()` | The serializable reference (no bytes). |

### `FileStore`

`MemoryFileStore` is built in. Implement the `FileStore` interface
(`put`, `get`, `delete`) to back uploads with disk, S3, or any blob store. Only the
file **reference** is ever serialized into a snapshot — never the bytes.
