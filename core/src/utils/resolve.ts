
/**
 * Kire Path Resolution Utility
 * Handles namespaces, extensions, and absolute/relative paths.
 */
export function resolvePath(filepath: string, config: any, platform: any): string {
    if (!filepath || filepath.startsWith('http')) return filepath;
    
    let path = filepath.replace(/\\/g, '/');
    const ext = '.' + config.extension;
    const namespaces = config.namespaces;

    // 1. Handle Namespaces (e.g., ns/path or ns.path)
    for (const ns in namespaces) {
        if (path.startsWith(ns + '/') || path.startsWith(ns + '.')) {
            const target = namespaces[ns];
            let suffix = path.slice(ns.length + 1);
            if (!suffix.endsWith(ext)) {
                suffix = suffix.replace(/\./g, '/') + ext;
            }
            return platform.join(target, suffix);
        }
    }

    // 2. Legacy/Dot resolution
    if (path.includes('.')) {
        const parts = path.split('.');
        const ns = parts[0];
        if (namespaces[ns]) {
            const target = namespaces[ns];
            let suffix = parts.slice(1).join('/');
            if (!suffix.endsWith(ext)) suffix += ext;
            return platform.join(target, suffix);
        }
        
        // Pure view path like "auth.login" (no slashes, no leading dot)
        if (!path.includes('/') && !path.startsWith('.') && !path.endsWith(ext)) {
            path = path.replace(/\./g, '/') + ext;
        }
    } 
    
    if (!path.endsWith(ext)) {
        const filename = path.split('/').pop() || "";
        if (!filename.includes('.')) {
            path += ext;
        }
    }

    // 2.1 Component namespace fallback: components/foo/bar.kire
    if (!platform.isAbsolute(path) && namespaces.components) {
        const inComponents = platform.join(namespaces.components, path);
        if (platform.exists(inComponents)) return inComponents;
    }

    // 3. Final normalization
    if (!platform.isAbsolute(path)) {
        path = platform.resolve(config.root, path);
    }
    
    return path;
}
