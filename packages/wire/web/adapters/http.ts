import type { WireAdapter } from "../kirewire";
import { Kirewire } from "../kirewire";
import { bus, type WirePayload } from "../utils/message-bus";
import { syncModelElements } from "../utils/model-sync";

type HttpClientAdapterOptions = {
    url: string;
    pageId: string;
    uploadUrl?: string;
    transport?: string;
};

type NormalizedOptions = {
    url: string;
    pageId: string;
    uploadUrl: string;
    transport: string;
};

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, "");
}

function resolveUploadUrl(baseUrl: string, uploadUrl?: string): string {
    if (uploadUrl) return uploadUrl;
    return `${trimTrailingSlash(baseUrl)}/upload`;
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function findStreamTarget(root: ParentNode, target: string): HTMLElement | null {
    let element = root.querySelector(target) as HTMLElement | null;
    if (!element) {
        const value = target.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        element = root.querySelector(`[wire\\:stream="${value}"]`) as HTMLElement | null;
    }
    return element;
}

function snapshotStreams(root: HTMLElement, effects: any[] | undefined): Map<string, string> {
    const snapshots = new Map<string, string>();
    const list = Array.isArray(effects) ? effects : [];

    for (let i = 0; i < list.length; i++) {
        const effect = list[i];
        if (!effect || effect.type !== "stream") continue;

        const targetKey = String(effect.payload?.target || "");
        if (!targetKey || snapshots.has(targetKey)) continue;

        const target = findStreamTarget(root, targetKey);
        if (target) snapshots.set(targetKey, target.innerHTML);
    }

    return snapshots;
}

function restoreStreams(root: HTMLElement, snapshots: Map<string, string>) {
    for (const [targetKey, html] of snapshots.entries()) {
        const target = findStreamTarget(root, targetKey);
        if (target) target.innerHTML = html;
    }
}

export class HttpClientAdapter implements WireAdapter {
    private readonly options: NormalizedOptions;
    private sse: EventSource | null = null;
    private onBusFlush: ((e: CustomEvent) => Promise<void>) | null = null;
    private sessionCheckInFlight = false;
    private lastSessionCheckAt = 0;
    private readonly sessionCheckIntervalMs = 3000;

    constructor(options: HttpClientAdapterOptions) {
        this.options = {
            url: options.url || "/_wire",
            pageId: options.pageId || "default-page",
            uploadUrl: resolveUploadUrl(options.url || "/_wire", options.uploadUrl),
            transport: options.transport || "sse",
        };

        Kirewire.pageId = this.options.pageId;
        this.setup();
    }

    public async call(componentId: string, method: string, params: any[] = []) {
        const payload: WirePayload = {
            id: String(componentId),
            method: String(method),
            params: Array.isArray(params) ? params : [],
            pageId: this.options.pageId,
        };
        return bus.enqueue(payload);
    }

    public defer(componentId: string, property: string, value: any) {
        Kirewire.defer(componentId, property, value);
    }

    public upload(files: FileList | File[], onProgress?: (progress: any) => void): Promise<any> {
        const list = Array.isArray(files) ? files : Array.from(files || []);
        if (list.length === 0) {
            return Promise.reject(new Error("No files to upload."));
        }

        return new Promise((resolve, reject) => {
            const formData = new FormData();
            for (let i = 0; i < list.length; i++) {
                formData.append("files[]", list[i]!);
            }

            const xhr = new XMLHttpRequest();

            if (onProgress) {
                xhr.upload.addEventListener("progress", (event) => {
                    if (!event.lengthComputable) return;
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percent: Math.round((event.loaded / event.total) * 100),
                        status: "uploading",
                    });
                });
            }

            xhr.addEventListener("error", () => reject(new Error("Upload request failed.")));
            xhr.addEventListener("abort", () => reject(new Error("Upload aborted.")));
            xhr.addEventListener("load", () => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(new Error(xhr.statusText || `Upload failed (${xhr.status}).`));
                    return;
                }

                try {
                    const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    resolve(parsed);
                } catch {
                    resolve(null);
                }
            });

            xhr.open("POST", this.options.uploadUrl);
            xhr.send(formData);
        });
    }

    public setup() {
        const globalObj = window as any;
        const existing = globalObj.__kirewire_http_adapter as HttpClientAdapter | undefined;
        if (existing && existing !== this) {
            existing.destroy();
        }
        globalObj.__kirewire_http_adapter = this;

        this.onBusFlush = async (event: CustomEvent) => {
            const { batch, finish, error } = event.detail;

            try {
                const response = await fetch(this.options.url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        batch,
                        pageId: this.options.pageId,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }

                const results = await response.json();
                this.applyBatchUpdates(toArray(results));
                finish(results);
            } catch (err) {
                error(err);
            }
        };

        window.addEventListener("wire:bus:flush" as any, this.onBusFlush as any);
        this.connectSse();
    }

    public destroy() {
        if (this.onBusFlush) {
            window.removeEventListener("wire:bus:flush" as any, this.onBusFlush as any);
            this.onBusFlush = null;
        }

        if (this.sse) {
            this.sse.close();
            this.sse = null;
        }
    }

    private connectSse() {
        if (this.options.transport !== "sse") return;

        const sseUrl = new URL(`${trimTrailingSlash(this.options.url)}/sse`, window.location.origin);
        sseUrl.searchParams.set("pageId", this.options.pageId);

        this.sse = new EventSource(sseUrl.toString());
        this.sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data?.type === "ping") return;
                if (data?.type !== "update") return;
                this.applyComponentUpdate(data);
            } catch {
                // Ignore malformed messages to keep connection alive.
            }
        };
        this.sse.onerror = () => { void this.checkSessionAfterDisconnect(); };
    }

    private applyBatchUpdates(results: any[]) {
        const processedIds = new Set<string>();

        for (let i = results.length - 1; i >= 0; i--) {
            const item = results[i];
            if (!item || item.error) continue;

            const id = String(item.id || "");
            if (!id || processedIds.has(id)) continue;

            this.applyComponentUpdate(item);
            processedIds.add(id);
        }
    }

    private applyComponentUpdate(payload: any) {
        const id = String(payload?.id || "");
        if (!id) return;

        const root = document.querySelector(
            `[wire\\:id="${id}"], [wire-id="${id}"]`,
        ) as HTMLElement | null;

        if (root && typeof payload?.html === "string" && payload.html.length > 0) {
            const snapshots = snapshotStreams(root, payload.effects);

            if (payload.state !== undefined) {
                root.setAttribute("wire:state", JSON.stringify(payload.state));
            } else {
                root.removeAttribute("wire:state");
            }
            root.removeAttribute("wire:checksum");

            Kirewire.patch(root, payload.html);

            const nextRoot = document.querySelector(
                `[wire\\:id="${id}"], [wire-id="${id}"]`,
            ) as HTMLElement | null;
            if (nextRoot) {
                restoreStreams(nextRoot, snapshots);
                if (payload.state && typeof payload.state === "object") {
                    syncModelElements(nextRoot, payload.state);
                }
            }
        }

        if (Array.isArray(payload?.effects)) {
            Kirewire.processEffects(payload.effects, id);
        }

        Kirewire.emitSync("component:update", {
            id,
            state: payload?.state || {},
            html: payload?.html || "",
            effects: Array.isArray(payload?.effects) ? payload.effects : [],
        });
    }

    private async checkSessionAfterDisconnect() {
        if (this.sessionCheckInFlight) return;

        const now = Date.now();
        if (now - this.lastSessionCheckAt < this.sessionCheckIntervalMs) return;
        this.lastSessionCheckAt = now;
        this.sessionCheckInFlight = true;

        try {
            const ended = await this.isSessionFinished();
            if (ended) {
                window.location.reload();
            }
        } finally {
            this.sessionCheckInFlight = false;
        }
    }

    private async isSessionFinished(): Promise<boolean> {
        const sessionUrl = new URL(`${trimTrailingSlash(this.options.url)}/session`, window.location.origin);
        sessionUrl.searchParams.set("pageId", this.options.pageId);

        let response: Response;
        try {
            response = await fetch(sessionUrl.toString(), {
                method: "GET",
                cache: "no-store",
                credentials: "same-origin",
                headers: { Accept: "application/json" },
            });
        } catch {
            return false;
        }

        if (response.status === 410 || response.status === 401 || response.status === 403) {
            return true;
        }

        if (!response.ok) return false;

        try {
            const payload = await response.json();
            return payload?.active === false || payload?.pageActive === false;
        } catch {
            return false;
        }
    }
}
