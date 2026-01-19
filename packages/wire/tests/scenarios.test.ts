import { beforeEach, describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { Wired, WireComponent } from "../src";

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
		kire = new Kire();
		kire.plugin(Wired.plugin, { secret: "test-secret" });
		Wired.register("register", RegistrationForm);
	});

	test("should handle form validation flow", async () => {
		// 1. Initial State
		const comp = new RegistrationForm();
		const data = comp.getPublicProperties();
		const memo = {
			id: "test-id",
			name: "register",
			path: "/",
			method: "GET",
			children: [],
			scripts: [],
			assets: [],
			errors: [],
			locale: "en",
		};
        const key = Wired.keystore("");
		const checksum = Wired.checksum.generate(data, memo, key);
		let snapshot = JSON.stringify({ data, memo, checksum });

		// 2. Submit Empty (Should Fail)
		let res = (await Wired.payload(key, {
			component: "register",
			snapshot,
			method: "save",
			params: [],
		})).data as any;

		let compRes = res.components[0];
		expect(compRes.effects.errors).toEqual({
			email: "Email required",
			password: "Password required",
			terms: "Terms required",
		});
		expect(compRes.effects.html).toContain("Email required");
		snapshot = compRes.snapshot;

		// 3. Update Email (Should Clear Error and Update State)
		res = (await Wired.payload(key, {
			component: "register",
			snapshot,
			method: "$set",
			params: ["email", "test@example.com"],
		})).data as any;

		compRes = res.components[0];
		const snapObj = JSON.parse(compRes.snapshot);
		expect(snapObj.data.email).toBe("test@example.com");
		snapshot = compRes.snapshot;

		// 4. Fill remaining and submit

		// Set password
		res = (await Wired.payload(key, {
			component: "register",
			snapshot,
			method: "$set",
			params: ["password", "123"],
		})).data as any;
		snapshot = res.components[0].snapshot;

		// Set terms
		res = (await Wired.payload(key, {
			component: "register",
			snapshot,
			method: "$set",
			params: ["terms", true],
		})).data as any;
		snapshot = res.components[0].snapshot;

		// Save
		res = (await Wired.payload(key, {
			component: "register",
			snapshot,
			method: "save",
			params: [],
		})).data as any;

		compRes = res.components[0];
		expect(compRes.effects.errors).toBeUndefined();
		expect(compRes.effects.redirect).toBe("/dashboard");
		expect(compRes.effects.emits).toEqual([{ event: "saved", params: [] }]);
	});
});
