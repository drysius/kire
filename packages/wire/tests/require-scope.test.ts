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
    const kire = new Kire({
        vfiles: {
            "page.kire": '@include("partial")',
            "partial.kire": 'Value: {{ global_var }}'
        }
    });
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
    const kire = new Kire({
        vfiles: {
            "comp-page.kire": `@component('card')
                        @slot('content')
                            {{ global_var }}
                        @end
                    @end`,
            "card.kire": `<div class="card">@yield('content')</div>`
        }
    });
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
