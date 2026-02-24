import { createHmac, timingSafeEqual } from "node:crypto";

interface ChecksumMemo {
    id?: string;
    component?: string;
}

function normalize(value: any, seen: WeakSet<object> = new WeakSet()): any {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((v) => normalize(v, seen));

    if (typeof (value as any).toJSON === "function") {
        try {
            return normalize((value as any).toJSON(), seen);
        } catch {}
    }

    if (seen.has(value)) return undefined;
    seen.add(value);

    const out: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) {
        const v = (value as any)[key];
        if (typeof v === "undefined" || typeof v === "function" || typeof v === "symbol") continue;
        out[key] = normalize(v, seen);
    }
    seen.delete(value);
    return out;
}

/**
 * Manages state integrity using HMAC-SHA256.
 */
export class ChecksumManager {
    constructor(private secret: string) {}

    /**
     * Generates a checksum for the given state and session key.
     */
    public generate(state: Record<string, any>, wireKey: string = "", memo: ChecksumMemo = {}): string {
        const content = JSON.stringify({
            v: 2,
            state: normalize(state),
            memo: normalize(memo)
        });
        const hmacKey = this.secret + wireKey;
        return createHmac("sha256", hmacKey).update(content).digest("hex");
    }

    /**
     * Verifies if the provided checksum matches the state and session key.
     */
    public verify(checksum: string, state: Record<string, any>, wireKey: string = "", memo: ChecksumMemo = {}): boolean {
        const actualBuffer = Buffer.from(checksum);
        const candidates = [
            this.generate(state, wireKey, memo),
            this.generate(state, wireKey) // legacy v1 compatibility
        ];

        for (const expected of candidates) {
            const expectedBuffer = Buffer.from(expected);
            if (expectedBuffer.length !== actualBuffer.length) continue;
            if (timingSafeEqual(expectedBuffer, actualBuffer)) return true;
        }
        return false;
    }
}
