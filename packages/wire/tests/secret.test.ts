import { describe, expect, test } from "bun:test";
import { Kirewire } from "../src/kirewire";

describe("Kirewire secret", () => {
	test("uses the provided secret", () => {
		const wire = new Kirewire({ secret: "stable-secret" });
		expect(wire.secret).toBe("stable-secret");
	});

	test("generates a random secret when none is provided", () => {
		const a = new Kirewire({});
		const b = new Kirewire({});
		// 32 random bytes rendered as hex → 64 chars.
		expect(a.secret).toMatch(/^[0-9a-f]{64}$/);
		expect(b.secret).toMatch(/^[0-9a-f]{64}$/);
		// Each process/instance gets its own secret.
		expect(a.secret).not.toBe(b.secret);
	});
});
