import { Kire, type KirePlugin } from "kire";
import { Arr } from "./Arr";
import { Str } from "./Str";
import { HtmlManager } from "./Html";
import { RouteManager } from "./Route";
import { MessageBag } from "./MessageBag";

export { Arr, ArrManager } from "./Arr";
export { Str, StrManager } from "./Str";
export { HtmlManager } from "./Html";
export { RouteManager } from "./Route";
export { MessageBag } from "./MessageBag";

declare module "kire" {
    interface Kire {
        route(url: string | URL, name?: string): this;
        withInput(input: Record<string, any>): this;
        withErrors(errors: Record<string, string[]>): this;
    }
}

export default {
	name: "@kirejs/utils",
	options: {},
	load(kire: Kire) {
        // Register static helpers globally immediately
        kire.$global("Str", Str);
        kire.$global("Arr", Arr);

        const extend = (instance: Kire) => {
            (instance as any).route = function(this: Kire, url: string | URL, name: string | null = null) {
                const route = new RouteManager();
                if (url instanceof URL) {
                    route.setUrl(url);
                } else {
                    try {
                        const u = new URL(url);
                        route.setUrl(u);
                    } catch {
                        route.set(url, name);
                    }
                }
                
                if (name) route.set(route.current(), name);

                this.$global("Route", route);
                this.$global("Html", new HtmlManager(route));
                
                // Initialize empty errors and old input
                this.$global("errors", new MessageBag());
                this.$global("_old", {});
                
                // Register helpers as globals so they are destructured in template scope
                this.$global("old", (key: string, def: any = null) => {
                    const oldInput = this.$globals.get("_old") || {};
                    return Arr.get(oldInput, key, def);
                });

                this.$global("url", (path: string = '') => {
                     return route.to(path);
                });
                
                return this;
            };

            (instance as any).withInput = function(this: Kire, input: Record<string, any>) {
                this.$global("_old", input);
                return this;
            };

            (instance as any).withErrors = function(this: Kire, errors: Record<string, string[]> | MessageBag) {
                const bag = errors instanceof MessageBag ? errors : new MessageBag(errors);
                this.$global("errors", bag);
                return this;
            };

            // Capture original fork to extend new instances
            const originalFork = instance.fork;
            instance.fork = function(this: Kire) {
                const forked = originalFork.call(this);
                extend(forked);
                return forked;
            };
        };

        extend(kire);

        // Register @error directive
        kire.directive({
            name: 'error',
            params: ['name:string'],
            children: true,
            type: 'html',
            async onCall(c) {
                const name = c.param('name');
                c.raw(`if ($ctx.$globals.errors && $ctx.$globals.errors.has(${JSON.stringify(name)})) {`);
                c.raw(`  const $message = $ctx.$globals.errors.first(${JSON.stringify(name)});`);
                if (c.children) await c.set(c.children);
                c.raw(`}`);
            }
        });
	},
} as KirePlugin;