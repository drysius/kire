export const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

/**
 * Executes a callback within a scope defined by an object's properties.
 * Provides a safer alternative to the deprecated `with` statement.
 *
 * @param obj The object providing the scope (local variables).
 * @param callback The function to execute.
 * @returns Promise with the result of callback execution.
 */
export async function scoped<T = any>(
	obj: Record<string, any>,
	callback: (...args: any[]) => T | Promise<T>,
): Promise<T> {
	const keys = Object.keys(obj);
	const values = Object.values(obj);

	const callbackSource = callback.toString();

	if (typeof callback !== "function") {
		throw new TypeError("Callback must be a function");
	}

	const func = new AsyncFunction(
		...keys,
		`"use strict";\nreturn (${callbackSource}).apply(this, arguments);`,
	);

	return await func(...values);
}
