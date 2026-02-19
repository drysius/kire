import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Manages state integrity using HMAC-SHA256.
 */
export class ChecksumManager {
    constructor(private secret: string) {}

    /**
     * Generates a checksum for the given state and session key.
     */
    public generate(state: Record<string, any>, wireKey: string = ""): string {
        const content = JSON.stringify(state);
        const hmacKey = this.secret + wireKey;
        return createHmac("sha256", hmacKey).update(content).digest("hex");
    }

    /**
     * Verifies if the provided checksum matches the state and session key.
     */
    public verify(checksum: string, state: Record<string, any>, wireKey: string = ""): boolean {
        const expected = this.generate(state, wireKey);
        const expectedBuffer = Buffer.from(expected);
        const actualBuffer = Buffer.from(checksum);

        if (expectedBuffer.length !== actualBuffer.length) {
            return false;
        }
        return timingSafeEqual(expectedBuffer, actualBuffer);
    }
}
