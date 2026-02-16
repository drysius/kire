import { Kire, type KirePlugin, type KireHandler } from "kire";
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
        withErrors(errors: Record<string, string[]> | MessageBag): this;
    }
}

export const KireUtils: KirePlugin = {
	name: "@kirejs/utils",
	options: {},
	load(kire: Kire) {
        // Register static helpers globally immediately
        kire.$global("Str", Str);
        kire.$global("Arr", Arr);

        const setup = (instance: any) => {
            const route = new RouteManager();
            instance.$global("Route", route);
            instance.$global("Html", new HtmlManager(route));
            
            // Initialize empty errors and old input
            instance.$global("errors", new MessageBag());
            instance.$global("_old", {});
            
            // Register helpers as globals bound to this instance using arrow functions
            // to correctly capture 'instance' from closure instead of relying on 'this'
            instance.$global("old", (key: string, def: any = null) => {
                const oldInput = instance.$globals["_old"] || {};
                return Arr.get(oldInput, key, def);
            });

            instance.$global("url", (path: string = '') => {
                return route.to(path);
            });

            instance.route = function(this: Kire, url: string | URL, name: string | null = null) {
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
                
                // Refresh globals to point to this instance's managers
                this.$global("Route", route);
                this.$global("Html", new HtmlManager(route));
                
                return this;
            };

            instance.withInput = function(this: Kire, input: Record<string, any>) {
                this.$global("_old", input);
                return this;
            };

            instance.withErrors = function(this: Kire, errors: Record<string, string[]> | MessageBag) {
                const bag = errors instanceof MessageBag ? errors : new MessageBag(errors);
                this.$global("errors", bag);
                return this;
            };
        };

        setup(kire);
        kire.onFork((fork) => setup(fork));

        // Register @error directive
        kire.directive({
            name: 'error',
            params: ['name'],
            children: true,
            description: "Renders the block if there are validation errors for the given field.",
            example: "@error('email')\n  <span class='error'>{{ $message }}</span>\n@end",
            onCall(api) {
                const nameExpr = api.getArgument(0);
                api.write(`if ($globals.errors && $globals.errors.has(${nameExpr})) {`);
                api.write(`  const $message = $globals.errors.first(${nameExpr});`);
                api.renderChildren();
                api.write(`}`);
            }
        });

        // Register @old directive/helper
        kire.directive({
            name: 'old',
            params: ['name', 'default'],
            description: "Outputs the old input value for the given field.",
            example: "<input type='text' name='email' value='@old(\"email\")' />",
            onCall(api) {
                const nameExpr = api.getArgument(0);
                const defExpr = api.getArgument(1) || "null";
                api.write(`$kire_response += $escape($globals.old(${nameExpr}, ${defExpr}));`);
            }
        });
	},
};

export default KireUtils;