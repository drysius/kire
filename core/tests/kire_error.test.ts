import { expect, test, describe } from "bun:test";
import { Kire } from "../src/kire";
import { KireError } from "../src/utils/error";

describe("KireError Stack Tracing", () => {
	test("Should map stack trace to .kire file", async () => {
		const kire = new Kire({ silent: true, production: false });
		const template = `
<h1>Hello</h1>
<?js throw new Error('Test Error') ?>
        `.trim();
		
		const filename = "test-error.kire";
		                const fn = await kire.compileFn(template, filename);
		                
		                let caughtError: any;
		                try {
		                    // We need to pass a context that has the file meta
		                    // but for simplicity let's just run it and see the stack
		                    await fn({ 
		                        $props: {}, 
		                        $globals: new Map(), 
		                        $file: { 
		                            path: filename, 
		                            code: (fn as any)._code, 
		                            source: template, 
		                            map: (fn as any)._map,
		                            execute: fn
		                        },
		                        $add: () => {},
		                        $escape: (v: any) => v,
		                        $emit: async () => {},
		                        $on: () => {}
		                    });
		                } catch (e: any) {
		                    caughtError = new KireError(e, { 
		                        path: filename, 
		                        code: (fn as any)._code, 
		                        source: template, 
		                        map: (fn as any)._map,
		                        execute: fn
		                    });
		                }
		        
		                                expect(caughtError).toBeDefined();
		        
		                                
		        
		                                expect(caughtError.stack).toContain("test-error.kire:2:");		                expect(caughtError.stack).toContain("KireError: Test Error");
		        	});
		        });
