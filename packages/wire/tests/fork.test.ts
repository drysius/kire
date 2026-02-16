import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent, Wired } from "../src";

class ContextComponent extends WireComponent {
	async render() {
		// Attempt to access 'request' from $globals, which should be set on the fork
		const req = this.kire.$globals["request"];
		return `<div>URL: ${req ? req.url : "undefined"}</div>`;
	}
}

describe("Wire Fork Support", () => {
	test("should use forked context in component render", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(Wired.plugin, { secret: "fork-test" });

		// Register component
		Wired.register("ctx-comp", ContextComponent);

		// Fork and set global
		const fkire = kire.fork();
		fkire.$global("request", { url: "/forked-path" });

		// Render using the fork
		// We use a template that calls @wire
		const html = await fkire.render(`@wire('ctx-comp')`);

		// Check if the component picked up the value from the fork
		expect(html).toContain("URL: /forked-path");
	});

	test("should use forked context in Wired.payload updates", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(Wired.plugin, { secret: "fork-update-test" });
		Wired.register("ctx-comp", ContextComponent);

		// Fork and set global
		const fkire = kire.fork();
		fkire.$global("request", { url: "/updated-path" });

		// Create initial snapshot
		const comp = new ContextComponent();
		comp.kire = fkire; // manually inject for test setup
		const data = comp.getPublicProperties();
		const memo = {
			id: "test-id",
			name: "ctx-comp",
			path: "/",
			method: "GET",
			children: [],
			scripts: [],
			assets: [],
			errors: [],
			locale: "en",
            listeners: {}
		};
		// We need to use the key associated with the secret we configured
		// However, Wired.plugin sets options on the singleton Wired class.
		// Wired.keystore uses Wired.options.secret.
		const key = Wired.keystore(""); 
		const checksum = Wired.checksum.generate(data, memo, key);
		const snapshot = JSON.stringify({ data, memo, checksum });

		// Perform update payload using the FORKED instance
		// We pass fkire as the last argument to Wired.payload
		const res = (
			await Wired.payload(
				key,
				{
					component: "ctx-comp",
					snapshot,
					method: "$refresh", // Just re-render
					params: [],
				},
				{},
				fkire, // <--- IMPORTANT: Passing the fork
			)
		).data as any;

		const compRes = res.components[0];
		// The re-rendered HTML in the effect should contain the updated path from the fork's context
		expect(compRes.effects.html).toContain("URL: /updated-path");
	});
});
