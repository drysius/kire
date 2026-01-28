import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";

describe("Kire Source Maps", () => {
	test("Should generate sourceMappingURL", async () => {
		const kire = new Kire({ production: false });
		const template = "Hello {{ it.name }}!";
		
		const code = await kire.compile(template, "hello.kire");
		
		expect(code).toContain("//# sourceURL=hello.kire");
		expect(code).toContain("//# sourceMappingURL=data:application/json");
        
        // Extract base64
        const match = code.match(/\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,(.*)/);
        expect(match).not.toBeNull();
        
        const json = Buffer.from(match![1], 'base64').toString('utf8');
        const map = JSON.parse(json);
        
        expect(map.version).toBe(3);
        expect(map.file).toBe("hello.kire");
        expect(map.sources).toContain("hello.kire");
        expect(map.mappings).not.toBe("");
	});
});
