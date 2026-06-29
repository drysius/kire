import { describe, expect, test } from "bun:test";
import { LiveComponent } from "../src/component";
import { Kirewire } from "../src/kirewire";
import { Component, lazy, prop, url } from "../src/decorators";

describe("@lazy", () => {
	@Component("report")
	@lazy
	class Report extends LiveComponent {
		@prop loaded = false;
		mount() {
			this.loaded = true;
		}
		render() {
			return `<div class="report">${this.loaded ? "ready" : "?"}</div>`;
		}
	}

	function wire() {
		const w = new Kirewire({ secret: "s" });
		w.component(Report);
		return w;
	}

	test("mount emits a placeholder and defers the real mount()", async () => {
		const { html, snapshot } = await wire().mount("report");
		expect(html).toContain("wire-lazy");
		expect(html).toContain("__lazyLoad");
		expect(snapshot.data.loaded).toBe(false);
		expect(snapshot.memo.lazyLoaded).toBe(false);
	});

	test("__lazyLoad runs the real lifecycle and renders", async () => {
		const w = wire();
		const { snapshot } = await w.mount("report");
		const res = await w.update({
			snapshot,
			updates: {},
			calls: [{ method: "__lazyLoad", params: [] }],
		});
		if ("skip" in res) throw new Error("skip");
		expect(res.snapshot.data.loaded).toBe(true);
		expect(res.effects.html).toContain("ready");
		expect(res.snapshot.memo.lazyLoaded).toBe(true);
	});
});

describe("@url", () => {
	@Component("search")
	class Search extends LiveComponent {
		@url @prop q = "";
		setQuery(value: string) {
			this.q = value;
		}
		render() {
			return `<div>${this.q}</div>`;
		}
	}

	test("emits a url effect mirroring @url props", async () => {
		const w = new Kirewire({ secret: "s" });
		w.component(Search);
		const { snapshot } = await w.mount("search");
		const res = await w.update({
			snapshot,
			updates: { q: "shoes" },
			calls: [],
		});
		if ("skip" in res) throw new Error("skip");
		expect(res.effects.url).toEqual({ query: { q: "shoes" } });
	});
});
