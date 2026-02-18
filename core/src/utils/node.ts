
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, join, isAbsolute, relative } from "node:path";

/**
 * Node.js Platform Implementation
 * All Node-specific APIs used by Kire are centralized here.
 */
export const platform = {
    // File System
    readFile: (path: string) => readFileSync(path, 'utf-8'),
    exists: (path: string) => existsSync(path),
    readDir: (path: string) => readdirSync(path),
    stat: (path: string) => statSync(path),
    writeFile: (path: string, data: string) => writeFileSync(path, data, 'utf-8'),

    // Path
    resolve: (...args: string[]) => resolve(...args).replace(/\\/g, '/'),
    join: (...args: string[]) => join(...args).replace(/\\/g, '/'),
    isAbsolute: (path: string) => isAbsolute(path),
    relative: (from: string, to: string) => relative(from, to).replace(/\\/g, '/'),

    // Environment
    cwd: () => process.cwd().replace(/\\/g, '/'),
    env: (key: string) => process.env[key],
    
    // Check if we are in production
    isProd: () => process.env.NODE_ENV === 'production'
};
