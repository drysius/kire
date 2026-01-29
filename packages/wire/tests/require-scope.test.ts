
import { test, expect } from "bun:test";
import { Kire } from "kire";
import Wired from "../src/index";
import { WireComponent } from "../src/component";

class LayoutComponent extends WireComponent {
    async render() {
        return this.view('page');
    }
}

test("$require (used by @include/@component) should respect globals from forked kire instance", async () => {
    const kire = new Kire();
    kire.plugin(Wired.plugin);
    
    // Register component
    Wired.register('layout-test', LayoutComponent);

    // Setup Resolver with nested templates
    kire.$resolver = async (path) => {
        if (path === 'page.kire') {
            // This uses @include which calls $ctx.$require
            return '@include("partial")';
        }
        if (path === 'partial.kire') {
            // This template accesses the global variable
            return 'Value: {{ global_var }}';
        }
        return '';
    };

    const fkire = kire.fork();
    fkire.$global('global_var', 'correct-value');

    const component = new LayoutComponent(fkire);
    // Note: context is set by Wired directive usually, but we set it manually for test
    component.context = { kire: fkire };

    const html = await component.render();
    
    expect(html).toContain('Value: correct-value');
});

test("@component directive should respect globals from forked kire instance", async () => {
    const kire = new Kire();
    kire.plugin(Wired.plugin);
    
    class CompTest extends WireComponent {
        async render() {
            return this.view('comp-page');
        }
    }

    Wired.register('comp-test', CompTest);

    kire.$resolver = async (path) => {
        if (path === 'comp-page.kire') {
            return `@component('card')
                        @slot('content')
                            {{ global_var }}
                        @end
                    @end`;
        }
        if (path === 'card.kire') {
            return `<div class="card">@yield('content')</div>`;
        }
        return '';
    };

    const fkire = kire.fork();
    fkire.$global('global_var', 'magic-value');

    const component = new CompTest(fkire);
    component.context = { kire: fkire };

    const html = await component.render();
    
    expect(html).toContain('magic-value');
});
