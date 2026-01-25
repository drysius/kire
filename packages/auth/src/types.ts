import type { KireContext } from "kire";

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

declare module "kire" {
	interface Kire {
		/**
		 * Renders a template from a file path.
		 * This is an alias for the `render` method.
		 * @param filepath The path to the template file.
		 * @param locals The local variables to pass to the template.
		 */
		view(filepath: string, locals?: Record<string, any>): Promise<string>;
	}
}
