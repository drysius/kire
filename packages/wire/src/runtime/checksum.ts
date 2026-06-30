import { createHmac, timingSafeEqual } from "node:crypto";
import type { Snapshot, SnapshotMemo } from "../contracts";

/**
 * Tamper protection for snapshots. The client may freely read a snapshot but must
 * not alter `data` or trusted `memo` fields; a mismatching HMAC is rejected before
 * any hydration happens, so forged state never reaches a component.
 *
 * `memo.children` is intentionally excluded: the client is allowed to add/remove
 * nested components, which mutates that map legitimately.
 */

/** Canonical bytes that the checksum signs. Order is stable via JSON key order. */
function payload(snapshot: Pick<Snapshot, "v" | "data" | "memo">): string {
	const { children, ...memo } = snapshot.memo as SnapshotMemo;
	void children;
	return JSON.stringify({ v: snapshot.v, data: snapshot.data, memo });
}

/** Compute the HMAC-SHA256 checksum for a snapshot's signable payload. */
export function sign(
	snapshot: Pick<Snapshot, "v" | "data" | "memo">,
	secret: string,
): string {
	return createHmac("sha256", secret).update(payload(snapshot)).digest("hex");
}

/**
 * Verify a snapshot's checksum in constant time. Returns false on any mismatch;
 * never throws and never reveals which part failed (callers respond with a
 * generic 419/404 to avoid leaking information to attackers).
 */
export function verify(snapshot: Snapshot, secret: string): boolean {
	const expected = sign(snapshot, secret);
	const a = Buffer.from(expected, "utf8");
	const b = Buffer.from(snapshot.checksum ?? "", "utf8");
	// timingSafeEqual requires equal lengths; unequal length is already a mismatch.
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
