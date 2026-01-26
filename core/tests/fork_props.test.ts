
import { test, expect } from "bun:test";
import { Kire } from "../src/kire";

test("Kire fork globals with shared cache (Fixed)", async () => {
    const kire = new Kire();
    kire.production = true; // Enable caching

    const kire1 = kire.fork();
    const kire2 = kire.fork();

    // Mock resolvers
    kire1.$resolver = async () => "{{ dynamicVar }}";
    kire2.$resolver = async () => "{{ dynamicVar }}";

    // kire1: dynamicVar is undefined.
    // In 'with' block, accessing undefined property on object is undefined.
    // {{ undefined }} renders nothing (empty string) in Kire usually (or string "undefined"?).
    // Let's check escapeHtml behavior. It usually returns "" for null/undefined.
    // Wait, accessing undefined property on with object?
    // with({a:1}) { b } -> ReferenceError if b is not in scope chain.
    // BUT we are using LayeredMap.toObject().
    // If dynamicVar is NOT in the map, it is NOT in the object.
    // So 'with' falls through to outer scope.
    // Outer scope (global) doesn't have it -> ReferenceError.
    
    // So kire1 SHOULD still fail if dynamicVar is missing from globals.
    // UNLESS we want to support undefined globals gracefully?
    // Kire default is ReferenceError for missing vars.
    
    const kire1Result = await kire1.view('common');
    // It should render an error page now, not throw
    expect(kire1Result).toContain("Kire Runtime Error");

    // kire2: HAS dynamicVar
    kire2.$global('dynamicVar', 'exists');
    
    // This previously failed because cache from kire1 was used (without dynamicVar destructuring).
    // Now with 'with', it should work.
    const result = await kire2.view('common');
    expect(result).toBe("exists");
});

test("$prop adds to locals", async () => {
    const kire = new Kire();
    kire.$resolver = async () => "{{ it.foo }} - {{ it.bar }}";
    
    kire.$prop('foo', 'value1');
    
    // bar passed at view time
    const result = await kire.view('props', { bar: 'value2' });
    
    expect(result).toBe("value1 - value2");
});

test("$prop object overload", async () => {
    const kire = new Kire();
    kire.$resolver = async () => "{{ it.a }} {{ it.b }}";
    
    kire.$prop({ a: 1, b: 2 });
    
    const result = await kire.view('propsObj');
    expect(result).toBe("1 2");
});

test("$namespaces works", async () => {
    const kire = new Kire();
    kire.$resolver = async () => "resolved";
    
    // Register namespace
    kire.namespace('~', '/root/path');
    
    // Check if it's stored in $namespaces
    expect(kire.$namespaces.get('~')).toBe('/root/path');
    
    // Test resolve (we mock resolver so path doesn't matter much, just that it calls resolve)
    // We can check the internal resolvePath output manually
    const resolved = kire.resolvePath('~/file');
    expect(resolved).toBe('/root/path/file.kire');
});

test("Removed mounts (should just use locals)", async () => {
    const kire = new Kire();
    
    // Namespace with placeholder
    kire.namespace('plugin', '/plugins/{name}');
    
    // Use $prop to provide 'name'
    kire.$prop('name', 'my-plugin');
    
    const resolved = kire.resolvePath('plugin/view');
    expect(resolved).toBe('/plugins/my-plugin/view.kire');
});
