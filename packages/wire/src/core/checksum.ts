import { createHmac, timingSafeEqual } from "node:crypto";
import type { WireSnapshot } from "../types";

export class ChecksumManager {
	constructor(private getSecret: () => string) {}

	public generate(
		data: Record<string, any>,
		memo: WireSnapshot["memo"],
		identifier: string = "",
	): string {
		const content = JSON.stringify({ data, memo });
		const secret = this.getSecret();
		const key = secret + identifier;
		return createHmac("sha256", key).update(content).digest("hex");
	}

	public verify(
		sum: string,
		data: Record<string, any>,
		memo: WireSnapshot["memo"],
		identifier: string = "",
	): boolean {
		const expected = this.generate(data, memo, identifier);
		const expectedBuffer = Buffer.from(expected);
		const actualBuffer = Buffer.from(sum);

		if (expectedBuffer.length !== actualBuffer.length) {
			return false;
		}
		return timingSafeEqual(expectedBuffer, actualBuffer);
	}
}
