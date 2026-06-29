import { randomUUID } from "node:crypto";
import type { LiveComponent } from "../component";
import type { Dehydrated } from "../contracts";
import { getDeep, setDeep } from "../runtime/properties";
import { type PartialMeta, Synth, type SynthChild } from "../synth/synth";
import { Feature } from "./feature";

const TOKEN = "wire-file:";

export interface UploadInput {
	name: string;
	type: string;
	data: Uint8Array;
}

export interface StoredFile extends UploadInput {
	id: string;
	size: number;
}

/** Pluggable temporary storage for uploads. Swap for disk/S3 in production. */
export interface FileStore {
	put(file: UploadInput): Promise<string>;
	get(id: string): Promise<StoredFile | undefined>;
	delete(id: string): Promise<void>;
}

/** In-memory store; fine for a single process and tests. */
export class MemoryFileStore implements FileStore {
	private readonly files = new Map<string, StoredFile>();

	async put(file: UploadInput): Promise<string> {
		const id = randomUUID();
		this.files.set(id, { ...file, id, size: file.data.byteLength });
		return id;
	}
	async get(id: string): Promise<StoredFile | undefined> {
		return this.files.get(id);
	}
	async delete(id: string): Promise<void> {
		this.files.delete(id);
	}
}

/** A handle to a temporarily-uploaded file, bound to its store. */
export class WireFile {
	constructor(
		readonly id: string,
		readonly name: string,
		readonly type: string,
		readonly size: number,
		private readonly source?: FileStore,
	) {}

	/** Read the raw bytes (requires a bound store). */
	async read(): Promise<Uint8Array> {
		const file = await this.source?.get(this.id);
		if (!file)
			throw new Error(`Uploaded file "${this.id}" is no longer available.`);
		return file.data;
	}

	/** Persist to disk at `path` and return it (Node/Bun). */
	async store(path: string): Promise<string> {
		const { writeFile } = await import("node:fs/promises");
		await writeFile(path, await this.read());
		return path;
	}

	toJSON() {
		return { id: this.id, name: this.name, type: this.type, size: this.size };
	}
}

/** Serializes {@link WireFile} as its metadata reference (never the bytes). */
export class FileUploadSynth extends Synth<WireFile> {
	readonly key = "file";
	constructor(private readonly store: FileStore) {
		super();
	}
	match(v: unknown): boolean {
		return v instanceof WireFile;
	}
	dehydrate(v: WireFile): [Dehydrated, PartialMeta] {
		return [v.toJSON(), {}];
	}
	hydrate(data: Dehydrated, _m: unknown, _c: SynthChild): WireFile {
		const d = data as { id: string; name: string; type: string; size: number };
		return new WireFile(d.id, d.name, d.type, d.size, this.store);
	}
}

/**
 * Resolves `wire:model` file-upload tokens into {@link WireFile} instances when
 * the client sets a property after uploading. A token is the string
 * `wire-file:<id>` (single) or an array of them (multiple).
 */
export class FileUploadFeature extends Feature {
	constructor(private readonly store: FileStore) {
		super();
	}

	override update(
		c: LiveComponent,
		path: string,
		value: unknown,
	): void | (() => void) {
		const resolved = this.resolve(value);
		if (resolved === value) return;
		// Run as a finisher so it lands AFTER the pipeline writes the raw token.
		return () => {
			setDeep(c as unknown as Record<string, unknown>, path, resolved);
			void getDeep(c, path);
		};
	}

	private resolve(value: unknown): unknown {
		if (typeof value === "string" && value.startsWith(TOKEN)) {
			return this.fileFromToken(value);
		}
		if (
			Array.isArray(value) &&
			value.every((v) => typeof v === "string" && v.startsWith(TOKEN))
		) {
			return value.map((v) => this.fileFromToken(v as string));
		}
		return value;
	}

	private fileFromToken(token: string): WireFile {
		const id = token.slice(TOKEN.length);
		// Metadata (name/type/size) is filled lazily on read; the id is enough to bind.
		return new WireFile(id, "", "", 0, this.store);
	}
}

/** Build the `wire-file:<id>` token the client sets after a successful upload. */
export function fileToken(id: string): string {
	return `${TOKEN}${id}`;
}

/** Server core of the upload endpoint: store files, return client tokens + meta. */
export async function handleUpload(
	store: FileStore,
	files: UploadInput[],
): Promise<{ token: string; name: string; type: string; size: number }[]> {
	const out: { token: string; name: string; type: string; size: number }[] = [];
	for (const file of files) {
		const id = await store.put(file);
		out.push({
			token: fileToken(id),
			name: file.name,
			type: file.type,
			size: file.data.byteLength,
		});
	}
	return out;
}
