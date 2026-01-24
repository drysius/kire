import { expect, test } from "bun:test";
import { Kire } from "kire";
import { KireRoute, Route } from "../src/index";

test("Kire Route - Basic Logic", () => {
	Route.set("/admin/dashboard", "admin.dashboard");

	expect(Route.current()).toBe("/admin/dashboard");
	expect(Route.currentRouteName()).toBe("admin.dashboard");

	expect(Route.is("admin.*")).toBe(true);
	expect(Route.is("admin.dashboard")).toBe(true);
	expect(Route.is("user.*")).toBe(false);
	expect(Route.is("/admin/*")).toBe(true);
});

test("Kire Route - Integration in Template", async () => {
	const kire = new Kire();
	kire.plugin(KireRoute);

	Route.set("/users/1");

	const tpl = `
    @if(Route.is('/users/*'))
        User Page: {{ Route.current() }}
    @else
        Other Page
    @end
    `;

	const result = await kire.render(tpl);
	expect(result.trim()).toBe("User Page: /users/1");

	Route.set("/home");
	const result2 = await kire.render(tpl);
	expect(result2.trim()).toBe("Other Page");
});

test("Kire Route - Wildcard matching", () => {
    Route.set("/foo/bar/baz");
    expect(Route.is("/foo/*")).toBe(true);
    expect(Route.is("*/bar/*")).toBe(true);
    expect(Route.is("/foo/bar/baz")).toBe(true);
    expect(Route.is("/foo/*/baz")).toBe(true);
});
