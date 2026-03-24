import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { WireProperty } from "../wire-property";
import type { FileStore, FileStoreMoveOptions } from "./file-store";

export type FileLike = {
	id?: string;
	name: string;
	size: number;
	mime?: string;
	type?: string;
};

const FILE_ENTRY_SCHEMA = Type.Object(
	{
		name: Type.String(),
		size: Type.Number({ minimum: 0 }),
		mime: Type.Optional(Type.String()),
		type: Type.Optional(Type.String()),
		id: Type.Optional(Type.String()),
	},
	{ additionalProperties: true },
);

export function normalizeFileList(value: any): FileLike[] {
	if (!value) return [];

	if (Array.isArray(value)) {
		const out: FileLike[] = [];
		for (let i = 0; i < value.length; i++) {
			const file = value[i];
			if (!file) continue;
			const entry = {
				id: String((file as any).id || ""),
				name: String((file as any).name || ""),
				size: Number((file as any).size || 0),
				mime: String((file as any).mime || (file as any).type || ""),
				type: String((file as any).type || (file as any).mime || ""),
			};
			if (entry.name || entry.id) out.push(entry);
		}
		return out;
	}

	if (
		value &&
		typeof value === "object" &&
		Array.isArray((value as any).files)
	) {
		return normalizeFileList((value as any).files);
	}

	if (value && typeof value === "object") {
		const file = value as any;
		const id = String(file.id || "");
		const name = String(file.name || "");
		const size = Number(file.size || 0);
		const mime = String(file.mime || file.type || "");
		const type = String(file.type || file.mime || "");

		if (!id && !name) return [];
		return [{ id, name, size, mime, type }];
	}

	return [];
}

function matchesMimeRule(file: FileLike, allowed: string[]): boolean {
	const mime = String(file.mime || file.type || "").toLowerCase();
	const extension =
		String(file.name || "")
			.toLowerCase()
			.split(".")
			.pop() || "";

	for (let i = 0; i < allowed.length; i++) {
		const token = allowed[i];
		const normalized = token.toLowerCase().trim();
		if (!normalized) continue;

		if (normalized.includes("/")) {
			if (normalized.endsWith("/*")) {
				const prefix = normalized.split("/")[0];
				if (mime.startsWith(`${prefix}/`)) return true;
			} else if (mime === normalized) {
				return true;
			}
		} else if (extension === normalized) {
			return true;
		}
	}
	return false;
}

export class WireFile extends WireProperty {
	public id: string = "";
	public name: string = "";
	public size: number = 0;
	public mime: string = "";
	public readonly __wire_type = "file";

	constructor(data?: { id: string; name: string; size: number; mime: string }) {
		super();
		if (data) {
			this.id = data.id;
			this.name = data.name;
			this.size = data.size;
			this.mime = data.mime;
		}
	}

	public hydrate(value: any): void {
		if (value && typeof value === "object") {
			this.id = String(value.id || "");
			this.name = String(value.name || "");
			this.size = Number(value.size || 0);
			this.mime = String(value.mime || "");
		}
	}

	public dehydrate(): any {
		return {
			id: this.id,
			name: this.name,
			size: this.size,
			mime: this.mime,
			__wire_type: this.__wire_type,
		};
	}

	public get file() {
		return this.id ? this : null;
	}

	/**
	 * Get the real file path from the store.
	 */
	public getPath(store: FileStore): string | null {
		return store.get(this.id);
	}

	/**
	 * Move the uploaded file to a target path or directory.
	 */
	public moveTo(
		store: FileStore,
		destination: string,
		options?: FileStoreMoveOptions,
	): string | null {
		if (!this.id) return null;
		return store.move(this.id, destination, options);
	}
}

export class WireUpload extends WireProperty {
	public readonly __wire_type = "upload";
	public files: WireFile[] = [];
	public uploading: { percent?: number; loaded?: number; total?: number } | null =
		null;

	constructor(initial?: FileLike[] | FileLike | null) {
		super();
		this.hydrate(initial);
	}

	public hydrate(value: any): void {
		const normalized = normalizeFileList(value);
		const files: WireFile[] = [];
		for (let i = 0; i < normalized.length; i++) {
			const item = normalized[i]!;
			files.push(
				new WireFile({
					id: String(item.id || ""),
					name: String(item.name || ""),
					size: Number(item.size || 0),
					mime: String(item.mime || item.type || ""),
				}),
			);
		}
		this.files = files;

		if (value && typeof value === "object" && (value as any).uploading) {
			this.uploading = { ...(value as any).uploading };
		}
	}

	public dehydrate(): any {
		const first = this.file;
		return {
			files: this.files.map((file) => file.dehydrate()),
			id: first?.id || "",
			name: first?.name || "",
			size: Number(first?.size || 0),
			mime: first?.mime || "",
			type: first?.mime || "",
			uploading: this.uploading || undefined,
			__wire_type: this.__wire_type,
		};
	}

	public clear() {
		this.files = [];
		this.uploading = null;
	}

	public add(file: FileLike) {
		this.files.push(
			new WireFile({
				id: String(file.id || ""),
				name: String(file.name || ""),
				size: Number(file.size || 0),
				mime: String(file.mime || file.type || ""),
			}),
		);
	}

	public toArray() {
		return this.files.map((item) => item.dehydrate());
	}

	public get file() {
		return this.files[0] || null;
	}

	public get id() {
		return this.file?.id || "";
	}

	public set id(value: string) {
		if (!this.file) {
			if (!value) return;
			this.files = [new WireFile()];
		}
		this.files[0]!.id = String(value || "");
	}

	public get name() {
		return this.file?.name || "";
	}

	public set name(value: string) {
		if (!this.file) this.files = [new WireFile()];
		this.files[0]!.name = String(value || "");
	}

	public get size() {
		return Number(this.file?.size || 0);
	}

	public set size(value: number) {
		if (!this.file) this.files = [new WireFile()];
		this.files[0]!.size = Number(value || 0);
	}

	public get mime() {
		return this.file?.mime || "";
	}

	public set mime(value: string) {
		if (!this.file) this.files = [new WireFile()];
		this.files[0]!.mime = String(value || "");
	}
}

export class Rule {
	private requiredMessage?: string;
	private minItems?: number;
	private maxItems?: number;
	private minMessage?: string;
	private maxMessage?: string;
	private maxSizeKb?: number;
	private maxSizeMessage?: string;
	private allowedMimes: string[] = [];
	private mimesMessage?: string;

	constructor(requiredMessage?: string) {
		this.requiredMessage = requiredMessage;
	}

	static file(msg?: string) {
		return new Rule(msg);
	}

	min(val: number, msg?: string) {
		this.minItems = Math.max(0, Number(val || 0));
		if (msg) this.minMessage = msg;
		return this;
	}

	max(val: number, msg?: string) {
		this.maxItems = Math.max(0, Number(val || 0));
		if (msg) this.maxMessage = msg;
		return this;
	}

	size(kilobytes: number, msg?: string) {
		this.maxSizeKb = Math.max(0, Number(kilobytes || 0));
		if (msg) this.maxSizeMessage = msg;
		return this;
	}

	mimes(values: string | string[], msg?: string) {
		const list = Array.isArray(values)
			? values
			: String(values || "").split(",");
		this.allowedMimes = list.map((entry) => entry.trim()).filter(Boolean);
		if (msg) this.mimesMessage = msg;
		return this;
	}

	validate(value: any): { success: boolean; errors: string[] } {
		const files = normalizeFileList(value);

		if (this.requiredMessage && files.length === 0) {
			return { success: false, errors: [this.requiredMessage] };
		}

		const arraySchema = Type.Array(FILE_ENTRY_SCHEMA, {
			minItems: this.minItems,
			maxItems: this.maxItems,
		});
		const checkInput: unknown = files;

		if (!Value.Check(arraySchema, checkInput)) {
			if (this.minItems !== undefined && files.length < this.minItems) {
				return {
					success: false,
					errors: [
						this.minMessage ||
							`Please select at least ${this.minItems} file(s).`,
					],
				};
			}
			if (this.maxItems !== undefined && files.length > this.maxItems) {
				return {
					success: false,
					errors: [
						this.maxMessage ||
							`You may not select more than ${this.maxItems} file(s).`,
					],
				};
			}

			const first = [...Value.Errors(arraySchema, files)][0];
			return {
				success: false,
				errors: [first?.message || "Invalid file selection."],
			};
		}

		if (this.maxSizeKb !== undefined) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (file.size / 1024 > this.maxSizeKb) {
					return {
						success: false,
						errors: [
							this.maxSizeMessage ||
								`The file ${file.name || "file"} may not be greater than ${this.maxSizeKb} KB.`,
						],
					};
				}
			}
		}

		if (this.allowedMimes.length > 0) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (!matchesMimeRule(file, this.allowedMimes)) {
					return {
						success: false,
						errors: [
							this.mimesMessage ||
								`The file type is not allowed for ${file.name || "file"}.`,
						],
					};
				}
			}
		}

		return { success: true, errors: [] };
	}
}
