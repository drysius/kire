/**
 * Resolves a file path using namespaces and dot notation.
 * @param filepath The path to resolve (e.g. "theme.index" or "~/index").
 * @param namespaces The map of registered namespaces.
 * @param mounts The map of mount data.
 * @param locals Data to resolve path placeholders (e.g. {theme: 'dark'}).
 * @param extension Default file extension.
 * @returns The resolved absolute path.
 */
export declare function resolvePath(filepath: string, namespaces: Map<string, string>, mounts: Map<string, Record<string, any>>, locals?: Record<string, any>, extension?: string): string;
