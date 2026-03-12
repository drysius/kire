import { Kirewire } from "../kirewire";

type PreviewKind = "image" | "audio" | "video" | "file";

type PreviewItem = {
    kind: PreviewKind;
    name: string;
    size: number;
    mime: string;
    src?: string;
};

function pathParts(path: string): string[] {
    return String(path || "")
        .split(".")
        .map((part) => part.trim())
        .filter(Boolean);
}

function readPathValue(source: any, path: string): any {
    if (!source) return undefined;
    const parts = pathParts(path);
    if (parts.length === 0) return source;

    let current = source;
    for (let i = 0; i < parts.length; i++) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[parts[i]!];
    }

    return current;
}

function htmlEscape(value: any): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function looksLikeUrl(value: string): boolean {
    return /^(https?:\/\/|blob:|data:|\/)/i.test(String(value || "").trim());
}

function detectPreviewKind(mime: string, name: string): PreviewKind {
    const normalizedMime = String(mime || "").toLowerCase();
    const normalizedName = String(name || "").toLowerCase();

    if (normalizedMime.startsWith("image/")) return "image";
    if (normalizedMime.startsWith("audio/")) return "audio";
    if (normalizedMime.startsWith("video/")) return "video";

    if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(normalizedName)) return "image";
    if (/\.(mp3|wav|ogg|m4a|aac|opus)$/.test(normalizedName)) return "audio";
    if (/\.(mp4|webm|mov|avi|mkv)$/.test(normalizedName)) return "video";

    return "file";
}

function sizeLabel(size: number) {
    const normalized = Number(size || 0);
    if (!Number.isFinite(normalized) || normalized <= 0) return "";

    if (normalized >= 1024 * 1024) return `${(normalized / (1024 * 1024)).toFixed(2)} MB`;
    if (normalized >= 1024) return `${(normalized / 1024).toFixed(2)} KB`;
    return `${normalized} B`;
}

function normalizeSource(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object" && Array.isArray((value as any).files)) {
        return (value as any).files;
    }
    return [value];
}

function objectUrlForFileLike(value: any, objectUrls: Set<string>) {
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return undefined;
    if (!(value instanceof Blob)) return undefined;

    const objectUrl = URL.createObjectURL(value);
    objectUrls.add(objectUrl);
    return objectUrl;
}

function toPreviewItem(value: any, objectUrls: Set<string>): PreviewItem | null {
    if (!value) return null;

    if (typeof value === "string") {
        const name = value.split("/").pop() || "file";
        return {
            kind: detectPreviewKind("", name),
            name,
            size: 0,
            mime: "",
            src: looksLikeUrl(value) ? value : undefined,
        };
    }

    if (typeof File !== "undefined" && value instanceof File) {
        return {
            kind: detectPreviewKind(value.type, value.name),
            name: value.name || "file",
            size: value.size || 0,
            mime: value.type || "",
            src: objectUrlForFileLike(value, objectUrls),
        };
    }

    if (typeof Blob !== "undefined" && value instanceof Blob) {
        return {
            kind: detectPreviewKind(value.type, "blob"),
            name: "blob",
            size: value.size || 0,
            mime: value.type || "",
            src: objectUrlForFileLike(value, objectUrls),
        };
    }

    if (typeof value === "object") {
        const raw = value as any;
        const name = String(raw.name || raw.filename || raw.title || "file");
        const mime = String(raw.mime || raw.mimetype || raw.type || "");
        const size = Number(raw.size || 0);

        let src = "";
        if (typeof raw.url === "string") src = raw.url;
        else if (typeof raw.src === "string") src = raw.src;
        else if (typeof raw.content === "string" && looksLikeUrl(raw.content)) src = raw.content;
        else if (raw.file) src = objectUrlForFileLike(raw.file, objectUrls) || "";

        return {
            kind: detectPreviewKind(mime, name),
            name,
            size: Number.isFinite(size) ? size : 0,
            mime,
            src: src || undefined,
        };
    }

    return null;
}

function renderPreview(items: PreviewItem[]): string {
    if (items.length === 0) return "";

    const html: string[] = [];
    html.push('<div class="grid gap-2">');

    for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        const safeName = htmlEscape(item.name || "file");
        const safeMime = htmlEscape(item.mime || "application/octet-stream");
        const safeSrc = item.src ? htmlEscape(item.src) : "";
        const safeSize = htmlEscape(sizeLabel(item.size));

        html.push('<article class="rounded-xl border border-base-300/70 bg-base-100/80 p-2">');
        if (item.kind === "image" && safeSrc) {
            html.push(`<img src="${safeSrc}" alt="${safeName}" class="h-auto max-h-40 w-full rounded-lg object-contain bg-base-200/40" />`);
        } else if (item.kind === "audio" && safeSrc) {
            html.push('<div class="w-full min-w-56">');
            html.push(`<audio controls preload="none" src="${safeSrc}" class="w-full"></audio>`);
            html.push("</div>");
        } else if (item.kind === "video" && safeSrc) {
            html.push(`<video controls preload="metadata" src="${safeSrc}" class="max-h-48 w-full rounded-lg bg-base-200/40"></video>`);
        } else if (safeSrc) {
            html.push(`<a href="${safeSrc}" target="_blank" rel="noopener noreferrer" class="link link-primary text-sm break-all">${safeName}</a>`);
        }

        html.push('<div class="mt-1 flex items-center justify-between gap-2 text-xs text-base-content/60">');
        html.push(`<span class="truncate">${safeName}</span>`);
        html.push('<span class="shrink-0">');
        if (safeSize) html.push(`${safeSize} - `);
        html.push(`${safeMime}</span>`);
        html.push("</div>");
        html.push("</article>");
    }

    html.push("</div>");
    return html.join("");
}

Kirewire.directive("file", ({ el, expression, modifiers, componentId, wire, cleanup }) => {
    if (!modifiers.includes("preview")) return;
    if (el instanceof HTMLInputElement && el.type === "file") return;

    const path = String(expression || el.getAttribute("wire:model") || "").trim();
    if (!path) return;

    let objectUrls = new Set<string>();

    const clearObjectUrls = () => {
        if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") {
            objectUrls.clear();
            return;
        }

        for (const value of objectUrls.values()) {
            try {
                URL.revokeObjectURL(value);
            } catch {}
        }
        objectUrls.clear();
    };

    const render = (incomingState?: any) => {
        clearObjectUrls();

        const proxy = wire.components.get(componentId) as any;
        const proxyTarget =
            proxy && proxy.__target && typeof proxy.__target === "object"
                ? (proxy.__target as Record<string, any>)
                : undefined;
        const state = incomingState && typeof incomingState === "object"
            ? incomingState
            : wire.getComponentState(el);

        const fromProxy = readPathValue(proxyTarget, path);
        const fromState = readPathValue(state, path);
        const source = fromProxy !== undefined ? fromProxy : fromState;
        const normalized = normalizeSource(source);

        const items: PreviewItem[] = [];
        for (let i = 0; i < normalized.length; i++) {
            const preview = toPreviewItem(normalized[i], objectUrls);
            if (preview) items.push(preview);
        }

        el.innerHTML = renderPreview(items);
    };

    const offUpdate = wire.$on("component:update", (data: any) => {
        if (data?.id !== componentId) return;
        render(data?.state);
    });

    cleanup(() => {
        offUpdate();
        clearObjectUrls();
    });

    render();
});

