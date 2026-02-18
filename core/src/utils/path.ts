import type { Kire } from "../kire";

/**
 * Resolução de caminhos no Kire, tratando namespaces e extensões.
 */
export function resolvePath(this: Kire<any>, filepath: string): string {
    if (!filepath || filepath.startsWith('http')) return filepath;
    
    let path = filepath.replace(/\\/g, '/');
    const ext = '.' + this.$extension;
    const namespaces = this.$namespaces;

    // 1. Handle Namespaces (e.g., ns/path or ns.path)
    for (const ns in namespaces) {
        if (path.startsWith(ns + '/') || path.startsWith(ns + '.')) {
            const target = namespaces[ns]!;
            let suffix = path.slice(ns.length + 1);
            if (!suffix.endsWith(ext)) {
                suffix = suffix.replace(/\./g, '/') + ext;
            }
            return this.$platform.join(target, suffix);
        }
    }

    // 2. Legacy/Dot resolution
    if (path.includes('.')) {
        const parts = path.split('.');
        const ns = parts[0]!;
        if (namespaces[ns]) {
            const target = namespaces[ns]!;
            let suffix = parts.slice(1).join('/');
            if (!suffix.endsWith(ext)) suffix += ext;
            return this.$platform.join(target, suffix);
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

    // 3. Final normalization
    if (!this.$platform.isAbsolute(path)) {
        path = this.$platform.resolve(this.$root, path);
    }
    
    return path;
}

export function namespace(this: Kire<any>, name: string, path: string) {
    this.$namespaces[name] = this.$platform.resolve(this.$root, path);
    return this;
}
