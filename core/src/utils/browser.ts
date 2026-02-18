
/**
 * Browser Platform Implementation
 * Most Node-specific APIs are dummies or throw in browser.
 * Use store override to provide actual logic for your environment.
 */
const throwNoAPI = (name: string) => {
    return () => { throw new Error(`Platform API '${name}' is not available in browser. Provide it via store or use virtual files.`); };
}

export const platform = {
    // File System (Generally not available in browser)
    readFile: throwNoAPI("readFile"),
    exists: () => false, // Always false for local disk
    readDir: throwNoAPI("readDir"),
    stat: throwNoAPI("stat"),
    writeFile: throwNoAPI("writeFile"),

    // Path (Simplified normalization)
    resolve: (...args: string[]) => args.join("/").replace(/\/+/g, '/'),
    join: (...args: string[]) => args.join("/").replace(/\/+/g, '/'),
    isAbsolute: (path: string) => path.startsWith("/") || path.startsWith("http"),
    relative: (from: string, to: string) => to,

    // Environment
    cwd: () => "/",
    env: (key: string) => undefined,
    
    // Default to false unless manually overridden
    isProd: () => false
};
