import type { Kire, KirePlugin } from "kire";
import { WireComponent } from "./component";
import { WireCore } from "./core";
import type { WireOptions } from "./types";

// Export types and core classes
export { WireComponent } from "./component";
export { WireCore } from "./core";
export * from "./types";

export class Kirewire {
  public static plugin: KirePlugin<WireOptions> = {
    name: "@kirejs/wire",
    options: {},
    load(kire: Kire, options: WireOptions = {}) {
      const core = WireCore.get();
      core.init(kire, options);

      kire.$ctx("$wire", core);

      kire.directive({
        name: "wire",
        params: ["name:string", "params:object"],
        children: false,
        type: "html",
        async onCall(compiler) {
           const name = compiler.param("name");
           const params = compiler.param("params") || "{}";

           compiler.raw(`await (async () => {
               const compName = ${JSON.stringify(name)};
               const initParams = ${params};
               const core = $ctx.$wire; 
               if (!core) throw new Error("Kirewire core not found.");

               const ComponentClass = core.getComponentClass(compName);
               
               if(ComponentClass) {
                   const instance = new ComponentClass();
                   instance.kire = $ctx.kire; 
                   instance.context = { kire: $ctx.kire, ...$ctx };
                   
                   if(instance.mount) await instance.mount(initParams);
                   
                   const html = await instance.render();
                   const state = instance.getPublicProperties();
                   const snapshot = core.getCrypto().sign(state);
                   
                   $ctx.res(`<div wire:id="{instance.__id}" wire:snapshot="{snapshot}" wire:component="{compName}">`);
                   $ctx.res(html);
                   $ctx.res(`</div>`);
               } else {
                   $ctx.res(`<!-- Wire component "{compName}" not found -->`);
               }
           })();`);
        }
      });

      kire.directive({
          name: "wireScripts",
          children: false,
          type: "html",
          onCall(compiler) {
              const opts = WireCore.get().getOptions();
              
              const config = JSON.stringify({
                  endpoint: opts.route, 
                  method: opts.method 
              });
              
              compiler.res(`<script>window.__KIREWIRE_CONFIG__ = ${config};</script>`);
              
              // Simplified inline version for dev/prototype
              compiler.res(`
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const config = window.__KIREWIRE_CONFIG__;
        
        window.KireWire = {
            call: async (id, snapshot, name, method, params) => {
                 const res = await fetch(config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({ component: name, snapshot, method, params })
                 });
                 const data = await res.json();
                 if(data.html) {
                     const el = document.querySelector(`[wire\\:id="{id}"]`);
                     if(el) { el.innerHTML = data.html; el.setAttribute('wire:snapshot', data.snapshot); }
                 }
                 if(data.events) {
                     data.events.forEach(e => window.dispatchEvent(new CustomEvent(e.name, { detail: e.params })));
                 }
            }
        };

        document.addEventListener('click', e => {
            const el = e.target.closest('[wire\\:click]');
            if(!el) return;
            const action = el.getAttribute('wire:click');
            const root = el.closest('[wire\\:id]');
            if(!root) return;
            const id = root.getAttribute('wire:id');
            const snap = root.getAttribute('wire:snapshot');
            const name = root.getAttribute('wire:component');
            
            let method = action; 
            let params = [];
            if(action.includes('(')) {
                const p = action.split('(');
                method = p[0];
                params = p[1].slice(0,-1).split(',').map(s=>s.trim().replace(/^['"]|['"]$/g, ''));
            }
            window.KireWire.call(id, snap, name, method, params);
        });
    });
</script>
              `);
          }
      });
    }
  };
}

// Module Augmentation
declare module "kire" {
    interface Kire {
        wire(name: string, component: new () => WireComponent): void;
    }
}

import { Kire } from "kire";
Kire.prototype.wire = function(name: string, component: new () => WireComponent) {
    WireCore.get().registerComponent(name, component);
};

export default Kirewire.plugin;