import { expect, test, describe, afterAll } from "bun:test";
import { Kire } from "../src/kire";
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Kire Bundle System", () => {
    const testDir = join(__dirname, "temp_templates");
    const bundleFile = join(__dirname, "test_bundle.js");

    // Setup: Create temp directory and templates
    if (!existsSync(testDir)) mkdirSync(testDir);
    writeFileSync(join(testDir, "hello.kire"), "Hello {{ name }}!");
    writeFileSync(join(testDir, "list.kire"), "@for(item of items){{ item }}@endfor");

    afterAll(() => {
        // Cleanup
        if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
        if (existsSync(bundleFile)) rmSync(bundleFile, { force: true });
    });

    test("should compile and build templates into a bundle file", async () => {
        const kire = new Kire({ root: __dirname });
        kire.compileAndBuild(["temp_templates"], bundleFile);

        expect(existsSync(bundleFile)).toBe(true);
        const content = readFileSync(bundleFile, "utf-8");
        
        // Verify simplified module structure
        expect(content).toContain("const _kire_bundled = {");
        // In this test environment (Bun as ESM), it seems to generate export default
        expect(content).toContain("export default _kire_bundled;");
        
        expect(content).toContain("temp_templates/hello.kire");
        expect(content).toContain("temp_templates/list.kire");
        expect(content).toContain("function($props = {}, $globals = {})");
    });

    test("should be able to load and use bundled templates", async () => {
        // Let's use the actual file by requiring it (Bun supports cjs require)
        const bundle = require(bundleFile);
        
        const kire = new Kire({
            root: __dirname,
            production: true,
            bundled: bundle
        });

        // Test rendering a bundled template via view()
        const res1 = await kire.view("temp_templates/hello", { name: "World" });
        expect(res1).toBe("Hello World!");

        const res2 = await kire.view("temp_templates/list", { items: [1, 2, 3] });
        expect(res2).toBe("123");
    });
});
