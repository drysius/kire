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
    const kire = new Kire({ silent: true });
    kire.$files[kire.resolvePath("page")] = '@include("partial")';
    kire.$files[kire.resolvePath("partial")] = 'Value: {{ global_var }}';
    kire.plugin(Wired.plugin);
    
    // Register component
    Wired.register('layout-test', LayoutComponent);

    const fkire = kire.fork();
    fkire.$global('global_var', 'correct-value');

    const component = new LayoutComponent(fkire);
    component.context = { kire: fkire };

    const html = await component.render();
    
    expect(html).toContain('Value: correct-value');
});

test("@component directive should respect globals from forked kire instance", async () => {
    const kire = new Kire({ silent: true });
    kire.$files[kire.resolvePath("comp-page")] = `@component('card')
                        @slot('content')
                            {{ global_var }}
                        @end
                    @end`;
    kire.$files[kire.resolvePath("card")] = `<div class="card">@yield('content')</div>`;
    kire.plugin(Wired.plugin);
    
    class CompTest extends WireComponent {
        async render() {
            return this.view('comp-page');
        }
    }

    Wired.register('comp-test', CompTest);

    const fkire = kire.fork();
    fkire.$global('global_var', 'magic-value');

    const component = new CompTest(fkire);
    component.context = { kire: fkire };

    const html = await component.render();
    
    expect(html).toContain('magic-value');
});
