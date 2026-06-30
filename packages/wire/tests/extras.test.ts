import { describe, expect, test } from "bun:test";
import { createFetchHandler } from "../src/adapters/fetch";
import { LiveComponent } from "../src/component";
import { Component, prop, validate } from "../src/decorators";
import {
	FileUploadFeature,
	FileUploadSynth,
	fileToken,
	handleUpload,
	MemoryFileStore,
	type WireFile,
} from "../src/features/file-upload";
import { WireForm } from "../src/features/form";
import { paginate } from "../src/features/pagination";
import { Kirewire } from "../src/kirewire";
import { createDefaultSynthRegistry } from "../src/synth/builtins";
import { modelSynth } from "../src/synth/class";
import { SynthRegistry } from "../src/synth/registry";

describe("modelSynth", () => {
	class Point {
		x = 0;
		y = 0;
	}
	test("round-trips a class instance and respects the allowlist", () => {
		const reg = createDefaultSynthRegistry(
			(k) => k === "pt" || k === "obj" || k === "arr",
		);
		reg.register(modelSynth("pt", Point));
		const p = Object.assign(new Point(), { x: 3, y: 4 });
		const restored = reg.hydrate(reg.dehydrate(p));
		expect(restored).toBeInstanceOf(Point);
		expect(restored).toEqual(p);
	});
	test("a disallowed synth key is rejected on hydrate", () => {
		const reg = new SynthRegistry((k) => k === "obj");
		reg.register(modelSynth("pt", Point));
		const dehydrated = reg.dehydrate(new Point());
		expect(() => reg.hydrate(dehydrated)).toThrow();
	});
});

describe("WireForm", () => {
	class CreatePost extends WireForm {
		@validate((v: unknown) =>
			typeof v === "string" && v.length >= 3 ? null : "min 3",
		)
		title = "";
	}
	test("validate() collects errors from @validate rules", () => {
		const form = new CreatePost();
		expect(form.validate()).toBe(false);
		expect(form.errors).toEqual({ title: "min 3" });
		form.title = "hello";
		expect(form.validate()).toBe(true);
		expect(form.errors).toEqual({});
	});
});

describe("paginate", () => {
	test("slices and reports page metadata", () => {
		const items = Array.from({ length: 25 }, (_, i) => i);
		const p = paginate(items, 2, 10);
		expect(p.data).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
		expect(p).toMatchObject({
			currentPage: 2,
			lastPage: 3,
			total: 25,
			from: 11,
			to: 20,
			hasMore: true,
			hasPrevious: true,
		});
	});
	test("clamps out-of-range pages", () => {
		expect(paginate([1, 2, 3], 99, 2).currentPage).toBe(2);
		expect(paginate([], 1, 10)).toMatchObject({ from: 0, to: 0, lastPage: 1 });
	});
});

describe("file uploads", () => {
	test("handleUpload stores bytes and returns tokens", async () => {
		const store = new MemoryFileStore();
		const refs = await handleUpload(store, [
			{
				name: "a.txt",
				type: "text/plain",
				data: new TextEncoder().encode("hello"),
			},
		]);
		expect(refs[0]!.token).toStartWith("wire-file:");
		expect(refs[0]!.size).toBe(5);
	});

	test("FileUploadSynth + Feature resolve a token to a readable WireFile", async () => {
		const store = new MemoryFileStore();
		const id = await store.put({
			name: "a.txt",
			type: "text/plain",
			data: new TextEncoder().encode("hi"),
		});

		const synth = createDefaultSynthRegistry();
		synth.register(new FileUploadSynth(store));

		@Component("uploader")
		class Uploader extends LiveComponent {
			@prop photo: WireFile | null = null;
			render() {
				return `<div>${this.photo ? "has" : "none"}</div>`;
			}
		}

		const wire = new Kirewire({ secret: "s", synth });
		wire.features.register(new FileUploadFeature(store));
		wire.component(Uploader);

		const { snapshot } = await wire.mount("uploader");
		const res = await wire.update({
			snapshot,
			updates: { photo: fileToken(id) },
			calls: [],
		});
		if ("skip" in res) throw new Error("skip");
		// The serialized snapshot carries the file reference via the synth.
		expect((res.snapshot.data.photo as [unknown, { s: string }])[1].s).toBe(
			"file",
		);

		// And the resolved WireFile can read its bytes back.
		const wf = synth.hydrate(res.snapshot.data.photo!) as WireFile;
		expect(new TextDecoder().decode(await wf.read())).toBe("hi");
	});
});

describe("fetch adapter", () => {
	@Component("counter")
	class Counter extends LiveComponent {
		@prop count = 0;
		increment() {
			this.count++;
		}
		render() {
			return `<div>${this.count}</div>`;
		}
	}

	function server() {
		const w = new Kirewire({ secret: "s" });
		w.component(Counter);
		return w;
	}

	test("handles an update POST as Request -> Response", async () => {
		const wire = server();
		const handler = createFetchHandler(wire);
		const { snapshot } = await wire.mount("counter");

		const res = await handler(
			new Request("http://x/_wire", {
				method: "POST",
				body: JSON.stringify({
					v: 1,
					components: [
						{
							snapshot,
							updates: {},
							calls: [{ method: "increment", params: [] }],
						},
					],
				}),
			}),
		);
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			components: Array<{ snapshot: { data: { count: number } } }>;
		};
		expect(body.components[0]!.snapshot.data.count).toBe(1);
	});

	test("handles a multipart upload POST", async () => {
		const store = new MemoryFileStore();
		const handler = createFetchHandler(server(), { store });
		const form = new FormData();
		form.append("files[]", new File(["data"], "a.txt", { type: "text/plain" }));
		const res = await handler(
			new Request("http://x/_wire/upload", { method: "POST", body: form }),
		);
		expect(res.status).toBe(200);
		const body = (await res.json()) as { files: Array<{ token: string }> };
		expect(body.files[0]!.token).toStartWith("wire-file:");
	});

	test("returns 404 for unknown routes", async () => {
		const res = await createFetchHandler(server())(
			new Request("http://x/nope"),
		);
		expect(res.status).toBe(404);
	});
});
