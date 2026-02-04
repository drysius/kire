
import { test, expect, mock } from "bun:test";
import { Kire } from "kire";
import Wired from "../src/index";
import { WireComponent } from "../src/component";

class ExampleComponent extends WireComponent {
    async render() {
        return this.view('example');
    }
}

class InlineComponent extends WireComponent {
    async render() {
        return this.html('<div>{{ request.url }}</div>');
    }
}

test("WireComponent should respect globals from forked kire instance", async () => {
    // Setup Kire
    const kire = new Kire();
    
    // Register Wired plugin
    kire.plugin(Wired.plugin);
    
    // Register component manually
    Wired.register('example', ExampleComponent);
    Wired.register('inline', InlineComponent);

    // Setup Resolver
    kire.$resolver = async (path) => {
        if (path === 'example.kire') {
            return '<div>{{ request.url }}</div>';
        }
        return '';
    };

    // 1. Run with global kire (no request global) - Should fail or return empty/undefined depending on usage
    // But since we are testing the FIX for forks, let's focus on the fork.
    
    // Create a fork
    const fkire = kire.fork();
    const req = { url: '/test-url' };
    fkire.$global('request', req);

    // Render using the fork
    // We simulate what the @wire directive does: create instance, inject kire
    const component = new ExampleComponent(fkire);
    component.context = { kire: fkire };

    const html = await component.render();
    
    expect(html).toContain('/test-url');
});

test("WireComponent should handle inline templates with globals from fork", async () => {
    const kire = new Kire();
    kire.plugin(Wired.plugin);
    
    const fkire = kire.fork();
    const req = { url: '/inline-url' };
    fkire.$global('request', req);

    const component = new InlineComponent(fkire);
    component.context = { kire: fkire };

    const html = await component.render();
    
    expect(html).toContain('/inline-url');
});

test("WireComponent should respect globals inherited from parent forks", async () => {
    const kire = new Kire();
    kire.plugin(Wired.plugin);
    
    const fkire1 = kire.fork();
    fkire1.$global('parent_var', 'from-parent');

    const fkire2 = fkire1.fork();
    fkire2.$global('child_var', 'from-child');

    // Test component that uses both
    class NestedComponent extends WireComponent {
        async render() {
            return this.html('<div>{{ parent_var }} - {{ child_var }}</div>');
        }
    }

    const component = new NestedComponent(fkire2);
    const html = await component.render();
    
    expect(html).toContain('from-parent - from-child');
});

test("WireComponent cache should not poison other forks with different globals (Isolation Test)", async () => {
    const kire = new Kire();
    kire.plugin(Wired.plugin);
    
    // Fork 1: Has 'request'
    const fkire1 = kire.fork();
    fkire1.$global('request', { url: '/url-1' });

    const component1 = new InlineComponent(fkire1);
    const html1 = await component1.render();
    expect(html1).toContain('/url-1');

    // Fork 2: Has 'request' with different value
    const fkire2 = kire.fork();
    fkire2.$global('request', { url: '/url-2' });
    const component2 = new InlineComponent(fkire2);
    const html2 = await component2.render();
    expect(html2).toContain('/url-2');

    // Fork 3: Does NOT have 'request'. 
    // We expect a ReferenceError because it shouldn't reuse the compiled code from Fork 1/2
    // which tried to destructure 'request' from globals.
    const fkire3 = kire.fork();
    const component3 = new InlineComponent(fkire3);
    
    // Silencing console.error just for this expected failure log
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
        await component3.render();
    } catch (e: any) {
        expect(e.message).toContain('request is not defined');
    } finally {
        console.error = originalConsoleError;
    }
});
