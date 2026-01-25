import { describe, expect, test } from "bun:test";
import { ChecksumManager } from "../../src/core/checksum";

describe("ChecksumManager", () => {
	const secret = "my-secret-key";
	const manager = new ChecksumManager(() => secret);

	const data = { count: 10, user: { name: "Alice" } };
	const memo: any = { id: "abc", name: "counter", path: "/" };
	const identifier = "session-123";

	test("should generate consistent checksums", () => {
		const sum1 = manager.generate(data, memo, identifier);
		const sum2 = manager.generate(data, memo, identifier);

		expect(sum1).toBe(sum2);
		expect(sum1.length).toBeGreaterThan(0);
	});

	test("should verify valid checksums", () => {
		const sum = manager.generate(data, memo, identifier);
		expect(manager.verify(sum, data, memo, identifier)).toBe(true);
	});

	test("should fail if data changes", () => {
		const sum = manager.generate(data, memo, identifier);
		const modifiedData = { ...data, count: 11 };

		expect(manager.verify(sum, modifiedData, memo, identifier)).toBe(false);
	});

	test("should fail if memo changes", () => {
		const sum = manager.generate(data, memo, identifier);
		const modifiedMemo = { ...memo, id: "def" };

		expect(manager.verify(sum, data, modifiedMemo, identifier)).toBe(false);
	});

	test("should fail if identifier changes", () => {
		const sum = manager.generate(data, memo, identifier);
		expect(manager.verify(sum, data, memo, "session-456")).toBe(false);
	});

	test("should fail if secret changes", () => {
		const sum = manager.generate(data, memo, identifier);

		const manager2 = new ChecksumManager(() => "different-secret");
		expect(manager2.verify(sum, data, memo, identifier)).toBe(false);
	});
});
