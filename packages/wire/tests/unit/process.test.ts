import { describe, expect, mock, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent } from "../../src/component";
import { ChecksumManager } from "../../src/core/checksum";
import {
	applyUpdates,
	createInitialMemo,
	createResponse,
	executeMethod,
	initializeComponent,
	renderComponent,
	resolveComponentClass,
	resolveComponentName,
	validateSnapshot,
} from "../../src/core/process";
import { ComponentRegistry } from "../../src/core/registry";

// Mock Component
class TestComponent extends WireComponent {
	public count = 0;
	public title = "Hello";

	async increment() {
		this.count++;
	}

	async render() {
		return `<div>${this.title}: ${this.count}</div>`;
	}
}

describe("Process Core Logic", () => {
	test("resolveComponentName should extract name from payload", () => {
		expect(resolveComponentName({ component: "test" } as any)).toBe("test");
		expect(
			resolveComponentName({
				snapshot: JSON.stringify({ memo: { name: "snap-test" } }),
			} as any),
		).toBe("snap-test");
		expect(resolveComponentName({} as any)).toBeUndefined();
	});

	test("resolveComponentClass should retrieve from registry", () => {
		const registry = new ComponentRegistry();
		registry.register("test", TestComponent);

		expect(resolveComponentClass("test", registry)).toBe(TestComponent);
		expect(resolveComponentClass("unknown", registry)).toBeUndefined();
	});

	test("createInitialMemo should setup default memo structure", () => {
		const comp = new TestComponent();
		const memo = createInitialMemo(comp, "test");

		expect(memo.name).toBe("test");
		expect(memo.id).toBe(comp.__id);
		expect(memo.locale).toBe("en");
		expect(memo.children).toEqual([]);
	});

	test("validateSnapshot should check format and checksum", () => {
		const checksum = new ChecksumManager(() => "secret");
		const data = { count: 1 };
		const memo: any = { id: "1", name: "test" };
		const sum = checksum.generate(data, memo, "user1");

		const validJson = JSON.stringify({ data, memo, checksum: sum });
		const invalidSumJson = JSON.stringify({ data, memo, checksum: "bad" });

		// Valid
		const res1 = validateSnapshot(validJson, checksum, "user1");
		expect(res1.error).toBeUndefined();
		expect(res1.snapshot?.data).toEqual(data);

		// Invalid Format
		const res2 = validateSnapshot("bad-json", checksum, "user1");
		expect(res2.error?.code).toBe(400);

		// Invalid Checksum
		const res3 = validateSnapshot(invalidSumJson, checksum, "user1");
		expect(res3.error?.code).toBe(403);

		// Invalid Checksum (Wrong User)
		const res4 = validateSnapshot(validJson, checksum, "user2");
		expect(res4.error?.code).toBe(403);
	});

	test("initializeComponent should inject dependencies", () => {
		const comp = new TestComponent();
		const kire = new Kire({ silent: true });
		const memo: any = { id: "old-id", listeners: { click: "handler" } };

		initializeComponent(comp, kire, { user: "admin" }, memo);

		expect(comp.kire).toBe(kire);
		expect(comp.context.user).toBe("admin");
		expect(comp.__id).toBe("old-id");
		expect(comp.listeners).toEqual({ click: "handler" });
	});

	test("applyUpdates should update properties and clear errors", async () => {
		const comp = new TestComponent();
		comp.addError("title", "Must be string");

		await applyUpdates(comp, {
			title: "New",
			_private: "ignore",
			kire: "hack",
		});

		expect(comp.title).toBe("New");
		expect(comp.__errors.title).toBeUndefined();
		// Reserved properties ignored
		expect((comp as any)._private).toBeUndefined();
	});

	test("executeMethod should call allowed methods", async () => {
		const comp = new TestComponent();

		// Normal method
		await executeMethod(comp, "increment", []);
		expect(comp.count).toBe(1);

		// $set
		await executeMethod(comp, "$set", ["count", 10]);
		expect(comp.count).toBe(10);

		// $refresh (no-op but allowed)
		const res = await executeMethod(comp, "$refresh", []);
		expect(res).toBeUndefined();

		// Forbidden
		const fail = await executeMethod(comp, "render", []);
		expect(fail?.error?.code).toBe(405);
	});

	test("renderComponent should return html string", async () => {
		const comp = new TestComponent();
		comp.kire = new Kire({ silent: true });

		const html = await renderComponent(comp);
		expect(html).toContain("Hello: 0");
	});

	test("createResponse should package snapshot and effects", () => {
		const comp = new TestComponent();
		const checksum = new ChecksumManager(() => "secret");
		const memo: any = { id: "1", name: "test" };

		comp.redirect("/home");
		comp.addError("field", "error");

		const res = createResponse(
			comp,
			memo,
			"<div>HTML</div>",
			{ count: 1 },
			checksum,
			"user",
			"test",
		);

		const componentRes = res.data.components[0];

		expect(res.code).toBe(200);
		expect(componentRes.effects.html).toContain("wire:snapshot");
		expect(componentRes.effects.html).toContain("<div>HTML</div>");
		expect(componentRes.effects.redirect).toBe("/home");
		expect(componentRes.effects.errors).toEqual({ field: "error" });
		expect(componentRes.effects.dirty).toEqual(["count"]);

		// Check snapshot included in payload
		const snap = JSON.parse(componentRes.snapshot);
		expect(snap.checksum).toBeDefined();
	});
});
