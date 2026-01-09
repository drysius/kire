import type { KirePlugin } from "kire";
import { Kire } from "kire";
import { WireComponent } from "./component";
import { WireCore } from "./core";
import type { WireOptions } from "./types";
import { getClientScript } from "./web/client";

// Export types and core classes
export { WireComponent } from "./component";
export { WireCore } from "./core";
export * from "./types";

export const Kirewire: KirePlugin<WireOptions> = {
  name: "@kirejs/wire",
  options: {},
  load(kire: Kire, options: WireOptions = {}) {
    const core = WireCore.get();
    core.init(kire, options);

    kire.$ctx("$wire", core);
    kire.$ctx("kire", kire);

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
                   // Inject kire into context but also keep existing context
                   instance.context = { ...$ctx, kire: $ctx.kire };
                   
                   if(instance.mount) await instance.mount(initParams);
                   
                   const html = await instance.render();
                   const state = instance.getPublicProperties();
                   const snapshot = core.getCrypto().sign(state);
                   
                   // Using interpolated strings carefully
                   $ctx.res(\`<div wire:id="\${instance.__id}" wire:snapshot="\${snapshot}" wire:component="\${compName}">\`);
                   $ctx.res(html);
                   $ctx.res(\`</div>\`);
               } else {
                   $ctx.res(\`<!-- Wire component "\${compName}" not found -->\`);
               }
           })();`);
      }
    });

    const injectScripts = (compiler: any) => {
      const opts = WireCore.get().getOptions();
      const script = getClientScript({
        endpoint: opts.route || '/_kirewire',
        method: opts.method || 'http'
      });
      compiler.res(script);
    };

    kire.directive({
      name: "kirewire",
      children: false,
      type: "html",
      onCall: injectScripts
    });

    // Alias for backward compatibility or alternative name
    kire.directive({
      name: "wireScripts",
      children: false,
      type: "html",
      onCall: injectScripts
    });
  }
};

// Module Augmentation
declare module "kire" {
  interface Kire {
    wire(name: string, component: new () => WireComponent): void;
  }
}

Kire.prototype.wire = function (name: string, component: new () => WireComponent) {
  WireCore.get().registerComponent(name, component);
};

export default Kirewire;
