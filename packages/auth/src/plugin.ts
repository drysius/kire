import type { CompilerContext, KirePlugin } from "kire";
import type { AuthOptions } from "./types";

export const KireAuth: KirePlugin<AuthOptions> = {
	name: "@kirejs/auth",
	options: {
		canPerm: async () => false,
		getUser: async () => null,
	} as AuthOptions,
	load(kire, opts) {
		const options = { ...KireAuth.options, ...opts } as AuthOptions;

		// Register global helpers
		kire.$ctx("$auth_getUser", options.getUser);
		kire.$ctx("$auth_can", options.canPerm);

		// Helper for else blocks
		const elseDirective = {
			name: "else",
			children: true,
			async onCall(c: CompilerContext) {
				c.raw("} else {");
				if (c.children) await c.set(c.children);
			},
		};

		// @auth
		kire.directive({
			name: "auth",
			children: true,
			type: "html",
			description: "Renders the block if the user is authenticated.",
			example: "@auth\n  <p>Welcome back!</p>\n@end",
			parents: [elseDirective],
			async onCall(c) {
				c.raw("if (await $ctx.$auth_getUser($ctx)) {");
				if (c.children) await c.set(c.children);
				if (c.parents) await c.set(c.parents);
				c.raw("}");
			},
		});

		// @guest / @notlogged
		const guestDirective = {
			children: true,
			type: "html",
			description: "Renders the block if the user is NOT authenticated.",
			example: "@guest\n  <a href='/login'>Login</a>\n@end",
			async onCall(c: CompilerContext) {
				c.raw("if (!(await $ctx.$auth_getUser($ctx))) {");
				if (c.children) await c.set(c.children);
				c.raw("}");
			},
		} as const;

		kire.directive({ name: "guest", ...guestDirective });
		kire.directive({ name: "notlogged", ...guestDirective });

		// @logged / @authenticated
		const loggedDirective = {
			children: true,
			type: "html",
			description: "Alias for @auth. Renders the block if the user is authenticated.",
			example: "@logged\n  <p>You are logged in.</p>\n@end",
			async onCall(c: CompilerContext) {
				c.raw("if (await $ctx.$auth_getUser($ctx)) {");
				if (c.children) await c.set(c.children);
				c.raw("}");
			},
		} as const;
		kire.directive({ name: "logged", ...loggedDirective });
		kire.directive({ name: "authenticated", ...loggedDirective });

		// @user
		kire.directive({
			name: "user",
			type: "js",
			description: "Injects the current user object into a variable named 'user'.",
			example: "@user\n<p>Hello, {{ user.name }}</p>",
			onCall(c) {
				c.raw("const user = await $ctx.$auth_getUser($ctx);");
			},
		});

		// @can(perm)
		kire.directive({
			name: "can",
			params: ["perm:any"],
			children: true,
			type: "html",
			description: "Checks if the user has a specific permission.",
			example: "@can('edit_posts')\n  <button>Edit</button>\n@end",
			parents: [elseDirective],
			async onCall(c) {
				const perm = c.param("perm");
				// Note: Currently force converts param to string.
				// To support variables, core parser needs update or user must pass quoted strings manually.
				c.raw(
					`if (await $ctx.$auth_can(${JSON.stringify(perm)}, await $ctx.$auth_getUser($ctx))) {
`
				);
				if (c.children) await c.set(c.children);
				if (c.parents) await c.set(c.parents);
				c.raw("}");
			},
		});

		// @notcan(perm)
		kire.directive({
			name: "notcan",
			params: ["perm:any"],
			children: true,
			type: "html",
			description: "Checks if the user DOES NOT have a specific permission.",
			example: "@notcan('view_admin')\n  <p>Access Denied</p>\n@end",
			async onCall(c) {
				const perm = c.param("perm");
				c.raw(
					`if (!(await $ctx.$auth_can(${JSON.stringify(perm)}, await $ctx.$auth_getUser($ctx)))) {`);
				if (c.children) await c.set(c.children);
				c.raw("}");
			},
		});

		// @canany(perms)
		kire.directive({
			name: "canany",
			params: ["perms:any"],
			children: true,
			type: "html",
			description: "Checks if the user has ANY of the provided permissions.",
			example: "@canany(['edit', 'delete'])\n  <button>Manage</button>\n@end",
			async onCall(c) {
				const perms = c.param("perms");
				// canany supports variables/arrays because parseArgs preserves array structure
				c.raw(`
						await (async () => {
							const perms = ${perms};
							let hasAny = false;
							const user = await $ctx.$auth_getUser($ctx);
							for (const p of (Array.isArray(perms) ? perms : [perms])) {
								if (await $ctx.$auth_can(p, user)) {
									hasAny = true;
									break;
								}
							}
							if (hasAny) {
						`);
				if (c.children) await c.set(c.children);
				c.raw("   }})();");
			},
		});

		// @noauth
		kire.directive({
			name: "noauth",
			children: true,
			type: "html",
			description:
				"Renders the block if the user is NOT authenticated. Alias for @guest.",
			example: "@noauth\n  <p>Please log in.</p>\n@end",
			parents: [elseDirective],
			async onCall(c) {
				c.raw("if (!(await $ctx.$auth_getUser($ctx))) {");
				if (c.children) await c.set(c.children);
				if (c.parents) await c.set(c.parents);
				c.raw("}");
			},
		});
	},
};
