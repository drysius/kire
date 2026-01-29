import { expect, test, describe } from "bun:test";
import { Kire } from "kire";
import KireUtils, { RouteManager } from "../src/index";

describe("RouteManager", () => {
    test("Basic Path Matching", () => {
        const route = new RouteManager();
        route.set("/admin/dashboard", "admin.dashboard");

        expect(route.current()).toBe("/admin/dashboard");
        expect(route.currentRouteName()).toBe("admin.dashboard");

        expect(route.is("admin.*")).toBe(true);
        expect(route.is("admin.dashboard")).toBe(true);
        expect(route.is("user.*")).toBe(false);
        expect(route.is("/admin/*")).toBe(true);
    });

    test("Wildcard Matching", () => {
        const route = new RouteManager();
        route.set("/foo/bar/baz");
        expect(route.is("/foo/*")).toBe(true);
        expect(route.is("*/bar/*")).toBe(true);
        expect(route.is("/foo/bar/baz")).toBe(true);
        expect(route.is("/foo/*/baz")).toBe(true);
    });

    test("RegExp Matching", () => {
        const route = new RouteManager();
        route.set("/users/123");
        expect(route.is(/^\/users\/\d+$/)).toBe(true);
        expect(route.is(/^\/posts/)).toBe(false);
    });

    test("URL Generation", () => {
        const route = new RouteManager();
        route.setUrl(new URL("http://localhost/users"));
        
        expect(route.to("/posts")).toBe("http://localhost/posts");
        expect(route.to("posts")).toBe("http://localhost/posts");
        expect(route.url()).toBe("http://localhost/users");
    });
});

describe("Kire Integration", () => {
    test("Route Global Injection via Fork", async () => {
        const kire = new Kire({ silent: true });
        kire.plugin(KireUtils);

        const req1 = kire.fork();
        req1.route(new URL("http://site.com/page1"), "page.1");

        const req2 = kire.fork();
        req2.route(new URL("http://site.com/page2"), "page.2");

        // Test Request 1
        const tpl = `{{ Route.current() }} : {{ Route.currentRouteName() }}`;
        const res1 = await req1.render(tpl);
        expect(res1.trim()).toBe("/page1 : page.1");

        // Test Request 2 (Isolation check)
        const res2 = await req2.render(tpl);
        expect(res2.trim()).toBe("/page2 : page.2");
    });
    
    test("URL Helper in Template", async () => {
        const kire = new Kire({ silent: true });
        kire.plugin(KireUtils);
        
        const req = kire.fork();
        req.route(new URL("http://localhost/base"));
        
        const tpl = `<a href="{{ url('login') }}">Login</a>`;
        const html = await req.render(tpl);
        
        expect(html).toBe('<a href="http://localhost/login">Login</a>');
    });
});
