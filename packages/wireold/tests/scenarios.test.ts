import { beforeEach, describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { WireComponent, wirePlugin } from "../src";

class RegistrationForm extends WireComponent {
	public email = "";
	public password = "";
	public terms = false;

	async save() {
		this.clearErrors();
		if (!this.email) this.addError("email", "Email required");
		if (!this.password) this.addError("password", "Password required");
		if (!this.terms) this.addError("terms", "Terms required");

		if (Object.keys(this.__errors).length === 0) {
			this.emit("saved");
			this.redirect("/dashboard");
		}
	}

	async render() {
		return `
            <form wire:submit.prevent="save">
                <input wire:model="email" value="${this.email}">
                ${this.__errors.email ? `<span class="error">${this.__errors.email}</span>` : ""}
                
                <input wire:model="password" type="password">
                <input wire:model="terms" type="checkbox" ${this.terms ? "checked" : ""}>
                
                <button>Register</button>
            </form>
        `;
	}
}

describe("Wire Scenarios", () => {
	let kire: Kire;

	beforeEach(() => {
		kire = new Kire({ silent: true });
		kire.plugin(wirePlugin, { secret: "test-secret" });
		kire.wireRegister("register", RegistrationForm);
	});

	test("should handle form validation flow", async () => {
		const comp = new RegistrationForm(kire);
		const data = comp.getPublicProperties();
		const memo: any = {
			id: "test-id",
			name: "register",
			path: "/",
			method: "GET",
			children: [],
			scripts: [],
			assets: [],
			errors: [],
			locale: "en",
            listeners: {}
		};
		const token = kire.wireKeystore("");
		const checksum = kire.$kire["~wire"].checksum.generate(data, memo, token);
		let snapshot = JSON.stringify({ data, memo, checksum });

		let res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "register",
                snapshot,
                method: "save",
                params: [],
            },
            locals: { wireToken: token }
        });

		let compRes = res.body.components[0];
		expect(compRes.effects.errors).toEqual({
			email: "Email required",
			password: "Password required",
			terms: "Terms required",
		});
		expect(compRes.effects.html).toContain("Email required");
		snapshot = compRes.snapshot;

		res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "register",
                snapshot,
                method: "$set",
                params: ["email", "test@example.com"],
            },
            locals: { wireToken: token }
        });

		compRes = res.body.components[0];
		const snapObj = JSON.parse(compRes.snapshot);
		expect(snapObj.data.email).toBe("test@example.com");
		snapshot = compRes.snapshot;

		res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "register",
                snapshot,
                method: "$set",
                params: ["password", "123"],
            },
            locals: { wireToken: token }
        });
		snapshot = res.body.components[0].snapshot;

		res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "register",
                snapshot,
                method: "$set",
                params: ["terms", true],
            },
            locals: { wireToken: token }
        });
		snapshot = res.body.components[0].snapshot;

		res = await kire.wireRequest({
            path: "/_wire",
            method: "POST",
            body: {
                component: "register",
                snapshot,
                method: "save",
                params: [],
            },
            locals: { wireToken: token }
        });

		compRes = res.body.components[0];
		expect(compRes.effects.errors).toBeUndefined();
		expect(compRes.effects.redirect).toBe("/dashboard");
		expect(compRes.effects.emits).toEqual([{ event: "saved", params: [] }]);
	});
});
