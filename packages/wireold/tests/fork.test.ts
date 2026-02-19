import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../src";

class ContextComponent extends WireComponent {
	async render() {
		const req = this.kire.$globals["request"];
		return `<div>URL: ${req ? req.url : "undefined"}</div>`;
	}
}

describe("Wire Fork Support", () => {
	test("should use forked context in component render", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(wirePlugin, { secret: "fork-test" });

		kire.wireRegister("ctx-comp", ContextComponent);

		const fkire = kire.fork();
		fkire.$global("request", { url: "/forked-path" });

		const html = await fkire.render(`@wire('ctx-comp')`);
		expect(html).toContain("URL: /forked-path");
	});

	test("should use forked context in wireRequest updates", async () => {
		const kire = new Kire({ silent: true });
		kire.plugin(wirePlugin, { secret: "fork-update-test" });
		kire.wireRegister("ctx-comp", ContextComponent);

		const fkire = kire.fork();
		fkire.$global("request", { url: "/updated-path" });

		const data = {};
		const memo: any = {
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
		
		const token = fkire.wireKeystore(""); 
		const checksum = fkire.$kire["~wire"].checksum.generate(data, memo, token);
		const snapshot = JSON.stringify({ data, memo, checksum });

		const res = await fkire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "ctx-comp",
                snapshot,
                method: "$refresh",
                params: [],
            },
            locals: { wireToken: token }
        });

        const response = res.body;
		const compRes = response.components[0];
		expect(compRes.effects.html).toContain("URL: /updated-path");
	});
});
