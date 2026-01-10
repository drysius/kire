import { createHash } from "node:crypto";

export class WireChecksum {
	constructor(private secret: string) {}

	public generate(data: any, memo: any): string {
		const content = JSON.stringify({ data, memo });
		return createHash("sha256")
			.update(content + this.secret)
			.digest("hex");
	}

	public verify(checksum: string, data: any, memo: any): boolean {
		return this.generate(data, memo) === checksum;
	}
}
