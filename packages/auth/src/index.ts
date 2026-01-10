import type { CompilerContext, KireContext, KirePlugin } from "kire";

export interface AuthOptions {
	/**
	 * Callback to check if a user has a specific permission.
	 */
	canPerm: (perm: string, user: any) => Promise<boolean> | boolean;
	/**
	 * Callback to retrieve the current user from the Kire context.
	 */
	getUser: (ctx: KireContext) => Promise<any> | any;
}

export const KireAuth: KirePlugin<AuthOptions> = {
	name: "@kirejs/auth",
	options: {
		canPerm: async () => false,
		getUser: async () => null,
	} as AuthOptions,
	load(kire, opts) {
		const options = {...KireAuth.options, ...opts } as AuthOptions;

		// Register global helpers
		kire.$ctx("$auth_getUser", options.getUser);
		kire.$ctx("$auth_can", options.canPerm);

		// @auth
		kire.directive({
			name: "auth",
			children: true,
			type: "html",
			parents: [
				{
					name: "else",
					children: true,
					async onCall(c) {
						c.raw("} else {");
						if (c.children) await c.set(c.children);
					},
				},
			],
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
			parents: [
				{
					name: "else",
					children: true,
					async onCall(c) {
						c.raw("} else {");
						if (c.children) await c.set(c.children);
					},
				},
			],
			async onCall(c) {
				const perm = c.param("perm");
				// We resolve user first, then pass to canPerm
				c.raw(
					`if (await $ctx.$auth_can(${JSON.stringify(perm)}, await $ctx.$auth_getUser($ctx))) {`,
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
			async onCall(c) {
				const perm = c.param("perm");
				c.raw(
					`if (!(await $ctx.$auth_can(${JSON.stringify(perm)}, await $ctx.$auth_getUser($ctx)))) {`,
				);
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
			async onCall(c) {
				const perms = c.param("perms");
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
				c.raw("   }\n})();");
			},
		});

		// @noauth
		kire.directive({
			name: "noauth",
			children: true,
			type: "html",
			parents: [
				{
					name: "else",
					children: true,
					async onCall(c) {
						c.raw("} else {");
						if (c.children) await c.set(c.children);
					},
				},
			],
			async onCall(c) {
				c.raw("if (!(await $ctx.$auth_getUser($ctx))) {");
				if (c.children) await c.set(c.children);
				if (c.parents) await c.set(c.parents);
				c.raw("}");
			},
		});
	},
};
export default KireAuth;