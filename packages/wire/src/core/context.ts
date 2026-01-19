export const WIRE_ID = Symbol("kirewire_identifier");

/**
 * Attaches the session/user identifier to the request object.
 * This is used to salt the checksum for security.
 *
 * @param req The request object.
 * @param identifier The unique identifier (e.g. session ID).
 * @param next Optional middleware next function.
 */
export function attachContext(req: any, identifier: string, next?: () => any) {
	(req as any)[WIRE_ID] = identifier;
	if (next) return next();
}

/**
 * Retrieves the identifier from the request object.
 * @param req The request object.
 * @returns The identifier string or empty string.
 */
export function getIdentifier(req: any): string {
	return (req as any)[WIRE_ID] || "";
}
