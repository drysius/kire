import { kirePlugin, type KirePlugin, type KireHandler } from "kire";
import type { AuthOptions } from "./types";

export const KireAuth = kirePlugin<AuthOptions>({
    canPerm: async () => false,
    getUser: async () => null,
}, (kire, options) => {
    kire.kireSchema({
        name: "@kirejs/auth",
        author: "Drysius",
        repository: "https://github.com/drysius/kire",
        version: "0.1.0"
    });

    // Register global helpers
    kire.$global("$auth_getUser", options.getUser);
    kire.$global("$auth_can", options.canPerm);

        // helper for else
        kire.directive({
            name: "else",
            onCall(api) {
                api.write("} else {");
                api.renderChildren();
            }
        });

		// @auth
		kire.directive({
			name: "auth",
			children: true,
			description: "Renders the block if the user is authenticated.",
			example: "@auth\n  <p>Welcome back!</p>\n@end",
			onCall(api) {
                api.markAsync();
				api.write("if (await $globals.$auth_getUser.call(this, $props)) {");
				api.renderChildren();
                if (api.node.related) {
                    api.renderChildren(api.node.related);
                }
				api.write("}");
			},
		});

		// @guest / @notlogged
		const guestHandler: KireHandler = (api) => {
            api.markAsync();
            api.write("if (!(await $globals.$auth_getUser.call(this, $props))) {");
            api.renderChildren();
            if (api.node.related) api.renderChildren(api.node.related);
            api.write("}");
        };

		kire.directive({ name: "guest", children: true, onCall: guestHandler, description: "Renders the block if the user is NOT authenticated.", example: "@guest\n  <a href='/login'>Login</a>\n@end" });
		kire.directive({ name: "notlogged", children: true, onCall: guestHandler, description: "Renders the block if the user is NOT authenticated.", example: "@notlogged\n  <a href='/login'>Login</a>\n@end" });

		// @logged / @authenticated
		const loggedHandler: KireHandler = (api) => {
            api.markAsync();
            api.write("if (await $globals.$auth_getUser.call(this, $props)) {");
            api.renderChildren();
            if (api.node.related) api.renderChildren(api.node.related);
            api.write("}");
        };
		kire.directive({ name: "logged", children: true, onCall: loggedHandler, description: "Alias for @auth. Renders the block if the user is authenticated.", example: "@logged\n  <p>You are logged in.</p>\n@end" });
		kire.directive({ name: "authenticated", children: true, onCall: loggedHandler, description: "Alias for @auth. Renders the block if the user is authenticated.", example: "@authenticated\n  <p>You are logged in.</p>\n@end" });

		// @user
		kire.directive({
			name: "user",
			children: false,
			description: "Injects the current user object into a variable named 'user'.",
			example: "@user\n<p>Hello, {{ user.name }}</p>",
			onCall(api) {
                api.markAsync();
				api.write("user = await $globals.$auth_getUser.call(this, $props);");
			},
		});

		// @can(perm)
		kire.directive({
			name: "can",
			params: ["perm"],
			children: true,
			description: "Checks if the user has a specific permission.",
			example: "@can('edit_posts')\n  <button>Edit</button>\n@end",
			onCall(api) {
				const perm = api.getArgument(0);
                api.markAsync();
				api.write(
					`if (await $globals.$auth_can.call(this, ${perm}, await $globals.$auth_getUser.call(this, $props))) {`,
				);
				api.renderChildren();
                if (api.node.related) api.renderChildren(api.node.related);
				api.write("}");
			},
		});

		// @notcan(perm)
		kire.directive({
			name: "notcan",
			params: ["perm"],
			children: true,
			description: "Checks if the user DOES NOT have a specific permission.",
			example: "@notcan('view_admin')\n  <p>Access Denied</p>\n@end",
			onCall(api) {
				const perm = api.getArgument(0);
                api.markAsync();
				api.write(
					`if (!(await $globals.$auth_can.call(this, ${perm}, await $globals.$auth_getUser.call(this, $props)))) {`,
				);
				api.renderChildren();
                if (api.node.related) api.renderChildren(api.node.related);
				api.write("}");
			},
		});

		// @canany(perms)
		kire.directive({
			name: "canany",
			params: ["perms"],
			children: true,
			description: "Checks if the user has ANY of the provided permissions.",
			example: "@canany(['edit', 'delete'])\n  <button>Manage</button>\n@end",
			onCall(api) {
				const perms = api.getArgument(0);
                api.markAsync();
				api.write(`
						await (async () => {
							const $perms = ${perms};
							let $hasAny = false;
							const $user = await $globals.$auth_getUser.call(this, $props);
							for (const $p of (Array.isArray($perms) ? $perms : [$perms])) {
								if (await $globals.$auth_can.call(this, $p, $user)) {
									$hasAny = true;
									break;
								}
							}
							if ($hasAny) {
						`);
				api.renderChildren();
				api.write("   } else { ");
                if (api.node.related) api.renderChildren(api.node.related);
                api.write(" } })();");
			},
		});

		// @noauth
		kire.directive({
			name: "noauth",
			children: true,
			description: "Renders the block if the user is NOT authenticated. Alias for @guest.",
			example: "@noauth\n  <p>Please log in.</p>\n@end",
			onCall(api) {
                api.markAsync();
				api.write("if (!(await $globals.$auth_getUser.call(this, $props))) {");
				api.renderChildren();
                if (api.node.related) api.renderChildren(api.node.related);
				api.write("}");
			},
		});
	}
);
