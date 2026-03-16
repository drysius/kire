import { Kirewire, type WireClientContext } from "../kirewire";

function setPathValue(target: Record<string, any>, path: string, value: any) {
	const parts = path
		.split(".")
		.map((part) => part.trim())
		.filter(Boolean);
	if (parts.length === 0) return;

	let current: Record<string, any> = target;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]!;
		const next = current[part];
		if (!next || typeof next !== "object") {
			current[part] = {};
		}
		current = current[part];
	}
	current[parts[parts.length - 1]!] = value;
}

function getPathValue(source: any, path: string): any {
	if (!source) return undefined;
	const parts = path
		.split(".")
		.map((part) => part.trim())
		.filter(Boolean);
	let current = source;

	for (let i = 0; i < parts.length; i++) {
		if (current == null || typeof current !== "object") return undefined;
		current = current[parts[i]!];
	}
	return current;
}

function normalizeUploadResult(result: any, multiple: boolean): any {
	const files = Array.isArray(result)
		? result
		: Array.isArray(result?.files)
			? result.files
			: result
				? [result]
				: [];

	if (multiple) return files;
	return files[0] || null;
}

function toOptimisticFileEntry(file: File) {
	return {
		name: String(file?.name || "file"),
		size: Number(file?.size || 0),
		mime: String(file?.type || ""),
		type: String(file?.type || ""),
		file,
	};
}

function seedOptimisticPreview(
	ctx: WireClientContext,
	files: FileList | File[],
) {
	const proxy = ctx.wire.components.get(ctx.componentId) as any;
	if (!proxy || !proxy.__target) return;

	const list = Array.isArray(files) ? files : Array.from(files || []);
	const FileCtor = typeof File !== "undefined" ? File : null;
	const normalized = FileCtor
		? list.filter((entry): entry is File => entry instanceof FileCtor)
		: [];
	if (normalized.length === 0) return;

	const nextValue =
		normalized.length > 1
			? normalized.map((file) => toOptimisticFileEntry(file))
			: toOptimisticFileEntry(normalized[0]!);

	setPathValue(
		proxy.__target as Record<string, any>,
		ctx.expression,
		nextValue,
	);
}

function updateUploadState(ctx: WireClientContext, uploading: any) {
	const proxy = ctx.wire.components.get(ctx.componentId) as any;
	if (!proxy || !proxy.__target) return;

	const target = proxy.__target as Record<string, any>;
	const current =
		getPathValue(target, ctx.expression) ??
		getPathValue(ctx.wire.getComponentState(ctx.el), ctx.expression) ??
		{};

	const base = current && typeof current === "object" ? current : {};
	setPathValue(target, ctx.expression, { ...base, uploading });
}

Kirewire.directive("model", (ctx) => {
	const { el } = ctx;

	if (!(el instanceof HTMLInputElement) || el.type !== "file") {
		return;
	}

	const handler = async () => {
		const files = el.files;
		if (!files || files.length === 0) return;

		const componentId = ctx.wire.getComponentId(el);
		if (!componentId) return;
		if (!ctx.wire.adapter || typeof ctx.wire.adapter.upload !== "function") {
			throw new Error("[Kirewire] Missing upload-capable adapter.");
		}

		ctx.wire.$emit("upload:started", { componentId, property: ctx.expression });
		seedOptimisticPreview(ctx, files);
		updateUploadState(ctx, {
			percent: 0,
			status: "uploading",
			loaded: 0,
			total: 0,
		});

		try {
			const result = await ctx.wire.adapter.upload(files, (progress) => {
				updateUploadState(ctx, progress);
				ctx.wire.$emit("upload:progress", {
					componentId,
					property: ctx.expression,
					...progress,
				});
			});

			const value = normalizeUploadResult(result, !!el.multiple);
			await ctx.wire.call(el, "$set", [ctx.expression, value]);

			updateUploadState(ctx, undefined);
			ctx.wire.$emit("upload:finished", {
				componentId,
				property: ctx.expression,
				result: value,
			});
		} catch (error: any) {
			updateUploadState(ctx, undefined);
			ctx.wire.$emit("upload:error", {
				componentId,
				property: ctx.expression,
				error: error?.message || String(error),
			});
		}
	};

	el.addEventListener("change", handler);
	ctx.cleanup(() => el.removeEventListener("change", handler));
});
