import type { KirePlugin } from "kire";

export class RouteManager {
	private _path: string = "/";
	private _name: string | null = null;

	/**
	 * Sets the current route context.
	 * @param path The current request path (e.g., /users/1).
	 * @param name Optional route name (e.g., users.show).
	 */
	set(path: string, name: string | null = null) {
		this._path = path;
		this._name = name;
		return this;
	}

	/**
	 * Get the current request URI.
	 */
	current() {
		return this._path;
	}

	/**
	 * Get the name of the current route.
	 */
	currentRouteName() {
		return this._name;
	}

	/**
	 * Determine if the current route matches a given pattern.
	 * @param patterns One or more patterns to match against. Wildcards (*) are supported.
	 */
	is(...patterns: string[]): boolean {
		const currentPath = this._path;
		const currentName = this._name;

		for (const pattern of patterns) {
			if (pattern === currentPath || pattern === currentName) {
				return true;
			}

			// Convert wildcard pattern to regex
			const regexString =
				"^" +
				pattern
					.split("*")
					.map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")) // Escape regex chars
					.join(".*") + // Re-join with .* for wildcards
				"$";

			const regex = new RegExp(regexString);

			if (regex.test(currentPath)) {
				return true;
			}

			if (currentName && regex.test(currentName)) {
				return true;
			}
		}

		return false;
	}
}

export const Route = new RouteManager();

export default {
	name: "@kirejs/route",
	options: {},
	load(kire) {
		kire.$global("Route", Route);
	},
} as KirePlugin;
