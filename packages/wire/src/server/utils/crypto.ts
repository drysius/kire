import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

export class WireCrypto {
	constructor(private secret: string) {}

	public sign(payload: object, expiresIn: string = "2h"): string {
		return jwt.sign({ ...payload, jti: randomUUID() }, this.secret, {
			expiresIn,
		});
	}

	public verify<T = any>(token: string): T {
		try {
			return jwt.verify(token, this.secret) as T;
		} catch (_e) {
			throw new Error("Invalid or expired token");
		}
	}
}
