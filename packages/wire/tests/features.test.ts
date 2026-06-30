import { describe, expect, test } from "bun:test";
import { LiveComponent } from "../src/component";
import {
	Component,
	locked,
	on,
	prop,
	renderless,
	validate,
} from "../src/decorators";
import { LockedPropertyError } from "../src/features/locked";
import { Kirewire } from "../src/kirewire";

@Component("form")
class FormComp extends LiveComponent {
	@prop name = "";
	@locked @prop ownerId = "u1";
	@validate((v: unknown) =>
		typeof v === "string" && v.length >= 3 ? null : "too short",
	)
	@prop
	title = "";

	calls: string[] = [];
	mount() {
		this.calls.push("mount");
	}
	booted() {
		this.calls.push("booted");
	}
	updatedName(v: string) {
		this.calls.push(`updatedName:${v}`);
	}
	@renderless ping() {
		return "pong";
	}
	@on("refresh-data") reload() {
		this.name = "reloaded";
	}
	render() {
		return `<div>${this.name}|${this.title}</div>`;
	}
}

function wire() {
	const w = new Kirewire({ secret: "s" });
	w.component(FormComp);
	return w;
}

describe("decorators + features", () => {
	test("@Component registers by name; lifecycle methods fire", async () => {
		const w = wire();
		const { snapshot, html } = await w.mount("form");
		expect(html).toContain("<div>|</div>");
		// mount + booted both ran (stored in a public prop -> serialized)
		expect(snapshot.data.calls).toEqual([
			["mount", "booted"],
			{ s: "arr" },
		] as never);
	});

	test("@locked blocks client writes", async () => {
		const w = wire();
		const { snapshot } = await w.mount("form");
		expect(
			w.update({ snapshot, updates: { ownerId: "hacker" }, calls: [] }),
		).rejects.toBeInstanceOf(LockedPropertyError);
	});

	test("updated<Prop> hook fires after a write", async () => {
		const w = wire();
		const { snapshot } = await w.mount("form");
		const res = await w.update({
			snapshot,
			updates: { name: "bob" },
			calls: [],
		});
		if ("skip" in res) throw new Error("skip");
		expect(res.snapshot.data.name).toBe("bob");
		// `calls` is public state, so it carries mount+booted from the prior request.
		expect(res.snapshot.data.calls).toEqual([
			["mount", "booted", "updatedName:bob"],
			{ s: "arr" },
		] as never);
	});

	test("@validate records an error effect for bad input", async () => {
		const w = wire();
		const { snapshot } = await w.mount("form");
		const res = await w.update({
			snapshot,
			updates: { title: "ab" },
			calls: [],
		});
		if ("skip" in res) throw new Error("skip");
		expect(res.effects.errors).toEqual({ title: "too short" });

		const ok = await w.update({
			snapshot: res.snapshot,
			updates: { title: "abcd" },
			calls: [],
		});
		if ("skip" in ok) throw new Error("skip");
		expect(ok.effects.errors).toBeUndefined();
	});

	test("@renderless skips re-render", async () => {
		const w = wire();
		const { snapshot } = await w.mount("form");
		const res = await w.update({
			snapshot,
			updates: {},
			calls: [{ method: "ping", params: [] }],
		});
		if ("skip" in res) throw new Error("skip");
		expect(res.effects.returns).toEqual(["pong"]);
		expect(res.effects.html).toBeUndefined();
	});

	test("@on exposes a listener map in the memo", async () => {
		const w = wire();
		const { snapshot } = await w.mount("form");
		expect(snapshot.memo.listeners).toEqual({ "refresh-data": "reload" });
	});

	test("$set / $toggle magic actions", async () => {
		const w = wire();
		const { snapshot } = await w.mount("form");
		const res = await w.update({
			snapshot,
			updates: {},
			calls: [{ method: "$set", params: ["name", "magic"] }],
		});
		if ("skip" in res) throw new Error("skip");
		expect(res.snapshot.data.name).toBe("magic");
	});
});
