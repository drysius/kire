import { describe, expect, test } from "bun:test";
import { Kire } from "kire";
import { KireAuth } from "../src/index.ts";

describe("KireAuth", () => {
	const createKire = () => {
		const kire = new Kire({ silent: true });
		kire.plugin(KireAuth, {
			canPerm: async (perm, user) => {
				if (!user) return false;
				return user.perms.includes(perm);
			},
			getUser: function(this: Kire, props: any) { return props?.user; },
		});
		return kire;
	};

	test("@auth and @else", async () => {
		const kireLogged = createKire();
		const htmlLogged = await kireLogged.render(
			"@auth @user Logged in: {{ user.name }} @else Not Logged @end",
			{ user: { name: "John", perms: [] } },
		);
		expect(htmlLogged.trim()).toBe("Logged in: John");

		const kireGuest = createKire();
		const htmlGuest = await kireGuest.render(
			"@auth @user Logged in: {{ user.name }} @else Not Logged @end",
			{ user: null },
		);
		expect(htmlGuest.trim()).toBe("Not Logged");
	});

	test("@guest and @notlogged", async () => {
		const template = `@guest Guest @end @notlogged Not Logged @end`;

		const kireLogged = createKire();
		const htmlLogged = await kireLogged.render(template, {
			user: { name: "John" },
		});
		expect(htmlLogged.trim().replace(/\s+/g, " ")).toBe("");

		const kireGuest = createKire();
		const htmlGuest = await kireGuest.render(template, { user: null });
		expect(htmlGuest.trim().replace(/\s+/g, " ")).toBe("Guest Not Logged");
	});

	test("@logged and @authenticated", async () => {
		const template = `@logged Logged @end @authenticated Authenticated @end`;

		const kireLogged = createKire();
		const htmlLogged = await kireLogged.render(template, {
			user: { name: "John" },
		});
		expect(htmlLogged.trim().replace(/\s+/g, " ")).toBe("Logged Authenticated");

		const kireGuest = createKire();
		const htmlGuest = await kireGuest.render(template, { user: null });
		expect(htmlGuest.trim().replace(/\s+/g, " ")).toBe("");
	});

	test("@can and @notcan", async () => {
		const template = `@can('admin') Admin @else No Admin @end @notcan('admin') Missing Admin @end`;

		const kireAdmin = createKire();
		const htmlAdmin = await kireAdmin.render(template, {
			user: { name: "Admin", perms: ["admin"] },
		});
		expect(htmlAdmin.trim().replace(/\s+/g, " ")).toContain("Admin");
		expect(htmlAdmin.trim().replace(/\s+/g, " ")).not.toContain("No Admin");
		expect(htmlAdmin.trim().replace(/\s+/g, " ")).not.toContain("Missing Admin");

		const kireUser = createKire();
		const htmlUser = await kireUser.render(template, {
			user: { name: "User", perms: ["user"] },
		});
		expect(htmlUser.trim().replace(/\s+/g, " ")).toContain("No Admin");
		expect(htmlUser.trim().replace(/\s+/g, " ")).toContain("Missing Admin");
	});

	test("@canany", async () => {
		const template = `@canany(['admin', 'editor']) Staff @end`;

		const kireEditor = createKire();
		const htmlEditor = await kireEditor.render(template, {
			user: { perms: ["editor"] },
		});
		expect(htmlEditor.trim()).toBe("Staff");

		const kireUser = createKire();
		const htmlUser = await kireUser.render(template, {
			user: { perms: ["user"] },
		});
		expect(htmlUser.trim()).toBe("");
	});

	test("@noauth", async () => {
		const template = `@noauth Guest @else Logged @end`;

		const kireGuest = createKire();
		const htmlGuest = await kireGuest.render(template, { user: null });
		expect(htmlGuest.trim()).toBe("Guest");

		const kireLogged = createKire();
		const htmlLogged = await kireLogged.render(template, {
			user: { name: "John" },
		});
		expect(htmlLogged.trim()).toBe("Logged");
	});
});
