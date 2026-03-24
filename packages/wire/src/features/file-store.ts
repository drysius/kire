import { randomUUID } from "node:crypto";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	rmSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

export type FileStoreMoveOptions = {
	overwrite?: boolean;
	keepName?: boolean;
};

export class FileStore {
	private tempDir: string;
	private fileMap = new Map<string, { path: string; expires: number }>();
	private cleanupTimer: ReturnType<typeof setInterval>;

	constructor(
		tempDir: string,
		private ttl: number = 3600000,
	) {
		// 1h default
		this.tempDir = tempDir;
		if (!existsSync(this.tempDir)) {
			mkdirSync(this.tempDir, { recursive: true });
		}
		this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
		if (typeof (this.cleanupTimer as any)?.unref === "function") {
			(this.cleanupTimer as any).unref();
		}
	}

	public store(filename: string, buffer: Buffer): string {
		const id = randomUUID();
		const safeName = basename(String(filename || "upload.bin")).replace(
			/[^\w.-]/g,
			"_",
		);
		const path = join(this.tempDir, `${id}_${safeName}`);
		writeFileSync(path, buffer);
		this.fileMap.set(id, { path, expires: Date.now() + this.ttl });
		return id;
	}

	public move(
		id: string,
		destination: string,
		options: FileStoreMoveOptions = {},
	): string | null {
		const entry = this.fileMap.get(String(id || "").trim());
		if (!entry || !existsSync(entry.path)) return null;

		const destRaw = String(destination || "").trim();
		if (!destRaw) return null;

		const keepName = options.keepName !== false;
		const overwrite = options.overwrite === true;
		const currentName = basename(entry.path);
		const targetPath = this.resolveDestinationPath(
			destRaw,
			keepName ? currentName : undefined,
		);
		if (!targetPath) return null;

		const targetDir = dirname(targetPath);
		if (!existsSync(targetDir)) {
			mkdirSync(targetDir, { recursive: true });
		}

		if (existsSync(targetPath)) {
			const targetStat = statSync(targetPath);
			if (targetStat.isDirectory()) return null;
			if (!overwrite) return null;
			unlinkSync(targetPath);
		}

		try {
			renameSync(entry.path, targetPath);
		} catch {
			// Cross-device move fallback.
			copyFileSync(entry.path, targetPath);
			unlinkSync(entry.path);
		}

		this.fileMap.set(id, { ...entry, path: targetPath });
		return targetPath;
	}

	public get(id: string): string | null {
		const entry = this.fileMap.get(id);
		if (entry && existsSync(entry.path)) {
			return entry.path;
		}
		return null;
	}

	public delete(id: string) {
		const entry = this.fileMap.get(id);
		if (entry) {
			if (existsSync(entry.path)) unlinkSync(entry.path);
			this.fileMap.delete(id);
		}
	}

	private cleanup() {
		const now = Date.now();
		for (const [id, entry] of this.fileMap.entries()) {
			if (now > entry.expires) {
				this.delete(id);
			}
		}
	}

	public clearStorage() {
		const ids = Array.from(this.fileMap.keys());
		for (let i = 0; i < ids.length; i++) {
			this.delete(ids[i]!);
		}

		if (!existsSync(this.tempDir)) return;
		const entries = readdirSync(this.tempDir, { withFileTypes: true });
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i]!;
			const path = join(this.tempDir, entry.name);
			rmSync(path, { recursive: true, force: true });
		}
	}

	public destroy() {
		clearInterval(this.cleanupTimer);
		this.clearStorage();
	}

	private resolveDestinationPath(
		destination: string,
		filename?: string,
	): string | null {
		const target = String(destination || "").trim();
		if (!target) return null;

		if (target.endsWith("/") || target.endsWith("\\")) {
			if (!filename) return null;
			return join(target, filename);
		}

		if (existsSync(target) && statSync(target).isDirectory()) {
			if (!filename) return null;
			return join(target, filename);
		}

		return target;
	}
}
