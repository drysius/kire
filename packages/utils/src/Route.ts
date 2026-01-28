export class RouteManager {
    private _path: string = "/";
    private _name: string | null = null;
    private _url: URL | null = null;

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
    
    setUrl(url: URL) {
        this._url = url;
        this._path = url.pathname;
        return this;
    }

    /**
     * Get the current request URI.
     */
    current() {
        return this._path;
    }
    
    /**
     * Get the current full URL.
     */
    url() {
        return this._url?.toString() || this._path;
    }
    
    /**
     * Generate an absolute URL to the given path.
     */
    to(path: string = ''): string {
        if (!this._url) return path;
        try {
            return new URL(path, this._url.origin).toString();
        } catch {
            return path;
        }
    }

    /**
     * Get the name of the current route.
     */
    currentRouteName() {
        return this._name;
    }

    /**
     * Determine if the current route matches a given pattern.
     * @param patterns One or more patterns to match against. 
     *                 Wildcards (*) are supported. Also accepts RegExp objects.
     *                 Supports Laravel-like patterns with parameters.
     */
    is(...patterns: (string | RegExp)[]): boolean {
        const currentPath = this._path;
        const currentName = this._name;

        for (const pattern of patterns) {
            if (pattern instanceof RegExp) {
                if (pattern.test(currentPath)) return true;
                if (currentName && pattern.test(currentName)) return true;
                continue;
            }

            if (pattern === currentPath || pattern === currentName) {
                return true;
            }

            // Convert pattern to regex, supporting:
            // 1. Wildcards (*)
            // 2. Laravel-like parameter patterns ({param})
            // 3. Optional parameters ({param?})
            // 4. Parameter constraints ({id:\d+})
            
            const regexString = this.patternToRegex(pattern);
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

    /**
     * Convert route pattern to regex.
     * Supports wildcards (*) and Laravel-style parameters.
     */
    private patternToRegex(pattern: string): string {
        // If pattern contains no special characters, match exactly
        if (!pattern.includes('*') && !pattern.includes('{')) {
            return `^${this.escapeRegex(pattern)}$`;
        }

        // Escape the entire string first
        let regex = this.escapeRegex(pattern);
        
        // Replace wildcards (*) with .*
        regex = regex.replace(/\\\*/g, '.*');
        
        // Replace Laravel-style parameters
        // {param} → matches any non-slash character sequence
        // {param?} → optional parameter
        // {id:\d+} → parameter with regex constraint
        regex = regex.replace(/\\\{([^}]+)\\\}/g, (match, param: string) => {
            // Check for optional parameter
            const isOptional = param.endsWith('?');
            if (isOptional) {
                param = param.slice(0, -1);
            }
            
            // Check for custom regex constraint
            const parts = param.split(':');
            if (parts.length === 2) {
                // Has custom regex: {id:\d+}
                const constraint = parts[1];
                return `(${constraint})${isOptional ? '?' : ''}`;
            }
            
            // Default: match any non-slash characters
            const paramName = parts[0];
            return `([^/]+)${isOptional ? '?' : ''}`;
        });

        return `^${regex}$`;
    }

    /**
     * Properly escape regex special characters.
     */
    private escapeRegex(pattern: string): string {
        return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Extract route parameters from current path based on pattern.
     * @param pattern Pattern with parameters (e.g., /users/{id})
     * @returns Object with parameter values or null if no match
     */
    params(pattern: string): Record<string, string> | null {
        const regexString = this.patternToRegex(pattern);
        const regex = new RegExp(regexString);
        const match = regex.exec(this._path);
        
        if (!match) return null;
        
        // Extract parameter names from pattern
        const paramNames: string[] = [];
        const paramPattern = /\{([^}]+)\}/g;
        let paramMatch;
        
        while ((paramMatch = paramPattern.exec(pattern)) !== null) {
            const fullParam = paramMatch[1];
            // Remove optional indicator and regex constraint
            const paramName = fullParam!.replace(/\?$/, '').split(':')[0];
            paramNames.push(paramName!);
        }
        
        // Create params object (skip first match which is full match)
        const params: Record<string, string> = {};
        paramNames.forEach((name, index) => {
            if (match[index + 1] !== undefined) {
                params[name] = match[index + 1] as string;
            }
        });
        
        return params;
    }

    /**
     * Check if current path starts with the given prefix.
     */
    startsWith(prefix: string): boolean {
        return this._path.startsWith(prefix);
    }

    /**
     * Check if current path ends with the given suffix.
     */
    endsWith(suffix: string): boolean {
        return this._path.endsWith(suffix);
    }

    /**
     * Check if current path contains the given substring.
     */
    contains(substring: string): boolean {
        return this._path.includes(substring);
    }
}