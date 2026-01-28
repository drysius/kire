import { expect, test, describe } from "bun:test";
import { Kire } from "kire";
import KireUtils, { Str, Arr, HtmlManager } from "../src/index";

describe("Str Utilities", () => {
    test("limit", () => {
        expect(Str.limit("Hello World", 5)).toBe("Hello...");
        expect(Str.limit("Hello", 10)).toBe("Hello");
    });

    test("slug", () => {
        expect(Str.slug("Hello World")).toBe("hello-world");
        expect(Str.slug(" Foo & Bar ")).toBe("foo-bar");
    });

    test("title", () => {
        expect(Str.title("hello world")).toBe("Hello World");
    });
});

describe("Arr Utilities", () => {
    test("get dot notation", () => {
        const data = { user: { profile: { name: "John" } } };
        expect(Arr.get(data, "user.profile.name")).toBe("John");
        expect(Arr.get(data, "user.age", 25)).toBe(25);
    });

    test("has", () => {
        const data = { user: { name: "John" } };
        expect(Arr.has(data, "user.name")).toBe(true);
        expect(Arr.has(data, "user.age")).toBe(false);
    });
});

describe("Html Helper", () => {
    test("script generation", () => {
        const html = new HtmlManager();
        expect(html.script("app.js")).toBe('<script src="app.js"></script>');
        expect(html.script("app.js", { async: true })).toBe('<script src="app.js" async></script>');
    });

    test("style generation", () => {
        const html = new HtmlManager();
        expect(html.style("app.css")).toBe('<link rel="stylesheet" href="app.css">');
    });
});

describe("Template Integration (Old & Error)", () => {
    test("old() input helper", async () => {
        const kire = new Kire();
        kire.plugin(KireUtils);
        
        const req = kire.fork();
        req.route("/login");
        req.withInput({ email: "test@example.com" });
        
        const tpl = `<input value="{{ old('email') }}">`;
        const html = await req.render(tpl);
        expect(html).toBe('<input value="test@example.com">');
    });

    test("@error directive", async () => {
        const kire = new Kire();
        kire.plugin(KireUtils);
        
        const req = kire.fork();
        req.route("/login");
        req.withErrors({ email: ["Invalid email address"] });
        
        const tpl = `
        @error('email')
            <span class="error">{{ $message }}</span>
        @end
        @error('password')
            Has Error
        @end
        `;
        
        const html = await req.render(tpl);
        expect(html).toContain('<span class="error">Invalid email address</span>');
        expect(html).not.toContain('Has Error');
    });
});
