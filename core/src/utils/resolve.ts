/**
 * Kire Path Resolution Utility
 * Handles namespaces, extensions, and absolute/relative paths.
 */
const HTTP_URL_REGEX = /^https?:\/\//i;

function normalizePath(path: string): string {
    return path.replace(/\\/g, "/");
}

function isInsideRoot(candidate: string, root: string, platform: any): boolean {
    const normalizedCandidate = normalizePath(candidate);
    const normalizedRoot = normalizePath(root);

    if (normalizedCandidate === normalizedRoot) return true;

    const relative = normalizePath(platform.relative(normalizedRoot, normalizedCandidate));
    return relative !== "" && relative !== "." && !relative.startsWith("..") && !platform.isAbsolute(relative);
}

function enforcePathBoundary(
    candidate: string,
    roots: string[],
    platform: any,
    originalPath: string
): string {
    for (const root of roots) {
        if (!root) continue;
        if (isInsideRoot(candidate, root, platform)) return candidate;
    }
    throw new Error(`Resolved path "${candidate}" from "${originalPath}" is outside allowed roots.`);
}

export function resolvePath(filepath: string, config: any, platform: any): string {
    if (!filepath || HTTP_URL_REGEX.test(filepath)) return filepath;

    let path = normalizePath(filepath);
    const ext = "." + config.extension;
    const namespaces = config.namespaces || {};
    const root = normalizePath(
        platform.isAbsolute(config.root) ? config.root : platform.resolve(config.root)
    );

    const resolvedNamespaces: Record<string, string> = Object.create(null);
    for (const [name, rawTarget] of Object.entries(namespaces)) {
        if (typeof rawTarget !== "string" || !rawTarget) continue;
        resolvedNamespaces[name] = normalizePath(
            platform.isAbsolute(rawTarget) ? rawTarget : platform.resolve(root, rawTarget)
        );
    }

    const allowedRoots = [root, ...Object.values(resolvedNamespaces)];
    const ensureAllowed = (candidate: string, scopeRoots = allowedRoots): string => {
        const absolute = normalizePath(
            platform.isAbsolute(candidate) ? candidate : platform.resolve(root, candidate)
        );
        return enforcePathBoundary(absolute, scopeRoots, platform, filepath);
    };

    // 1. Handle Namespaces (e.g., ns/path or ns.path)
    for (const ns in resolvedNamespaces) {
        if (path.startsWith(ns + '/') || path.startsWith(ns + '.')) {
            const target = resolvedNamespaces[ns]!;
            let suffix = path.slice(ns.length + 1);
            if (!suffix.endsWith(ext)) {
                suffix = suffix.replace(/\./g, '/') + ext;
            }
            return ensureAllowed(platform.join(target, suffix), [target]);
        }
    }

    // 2. Legacy/Dot resolution
    if (path.includes('.')) {
        const parts = path.split('.');
        const ns = parts[0];
        if (ns && resolvedNamespaces[ns]) {
            const target = resolvedNamespaces[ns]!;
            let suffix = parts.slice(1).join('/');
            if (!suffix.endsWith(ext)) suffix += ext;
            return ensureAllowed(platform.join(target, suffix), [target]);
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
    const componentsRoot = resolvedNamespaces.components;
    if (!platform.isAbsolute(path) && componentsRoot) {
        const inComponents = platform.join(componentsRoot, path);
        if (platform.exists(inComponents)) {
            return ensureAllowed(inComponents, [componentsRoot]);
        }
    }

    // 3. Final normalization
    if (!platform.isAbsolute(path)) {
        path = platform.resolve(root, path);
    }

    return ensureAllowed(path);
}
