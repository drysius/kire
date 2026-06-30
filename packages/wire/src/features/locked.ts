import type { LiveComponent } from "../component";
import { resolveMeta } from "../metadata";
import { Feature } from "./feature";

/** Thrown when the client tries to write a `@locked` property. */
export class LockedPropertyError extends Error {
	constructor(property: string) {
		super(`Cannot update locked property "${property}" from the client.`);
		this.name = "LockedPropertyError";
	}
}

/** Rejects client writes to properties marked `@locked`. */
export class LockedFeature extends Feature {
	override update(c: LiveComponent, path: string): void {
		const root = path.split(".")[0]!;
		if (resolveMeta(c).locked.has(root)) throw new LockedPropertyError(root);
	}
}
