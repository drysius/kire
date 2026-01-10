import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent } from "../src";

class LifecycleComponent extends WireComponent {
	public title = "Original";
	public log: string[] = [];

	async mount(title: string) {
		this.title = title;
		this.log.push("mount");
	}

	async hydrated() {
		this.log.push("hydrated");
	}

	async updated(name: string, value: any) {
		this.log.push(`updated:${name}:${value}`);
	}

	async rendered() {
		this.log.push("rendered");
	}

	async render() {
		return `<div>${this.title}</div>`;
	}

	async changeTitle(newTitle: string) {
		this.title = newTitle;
	}
}

describe("WireComponent", () => {
	test("should handle public properties", () => {
		const comp = new LifecycleComponent();
		comp.title = "Changed";
		// @ts-expect-error
		comp._privateProp = "secret";

		const props = comp.getPublicProperties();
		expect(props).toEqual({ title: "Changed", log: [] });
		expect(props._privateProp).toBeUndefined();
	});

	test("should handle redirect", () => {
		const comp = new LifecycleComponent();
		comp.redirect("/new-url");
		expect(comp.__redirect).toBe("/new-url");
	});

	test("should fill properties from state", () => {
		const comp = new LifecycleComponent();
		comp.fill({ title: "Restored", log: ["history"] });
		expect(comp.title).toBe("Restored");
		expect(comp.log).toEqual(["history"]);
	});

	test("lifecycle execution order (simulated)", async () => {
		// This test simulates what Core does
		const comp = new LifecycleComponent();
		comp.kire = new Kire();

		// 1. Fill (Hydration)
		comp.fill({ title: "Hydrated" });
		await comp.hydrated();

		// 2. Action
		await comp.changeTitle("Updated");
		await comp.updated("changeTitle", "Updated");

		// 3. Render
		await comp.render();
		await comp.rendered();

		expect(comp.log).toEqual([
			"hydrated",
			"updated:changeTitle:Updated",
			"rendered",
		]);
		expect(comp.title).toBe("Updated");
	});
});
