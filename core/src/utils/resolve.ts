export function resolvePath(
	filepath: string,
	namespaces: Map<string, string>,
	locals: Record<string, any> = {},
	extension = "kire",
): string {
	if (!filepath || filepath.startsWith("http")) return filepath;

	let normalized = filepath.replace(/\\/g, "/");

    // Tenta resolver por namespace
    for (const [ns, templatePath] of namespaces) {
        if (normalized.startsWith(ns) || ns === "@") {
            let path = templatePath;
            if (path.includes("{")) {
                path = path.replace(/\{(\w+)\}/g, (_, key) => locals[key] ?? `{${key}}`);
            }

            let suffix = ns === "@" ? normalized : normalized.slice(ns.length);
            if (suffix[0] === "." || suffix[0] === "/") suffix = suffix.slice(1);
            
            if (extension) suffix = suffix.replace(/\./g, "/");
            
            normalized = (path + "/" + suffix).replace(/\/+/g, "/");
            break;
        }
    }

	if (extension && !normalized.endsWith("." + extension)) {
        // Verifica se não é um arquivo com outra extensão já definida
        if (!normalized.includes(".", normalized.lastIndexOf("/"))) {
             normalized = normalized.replace(/\./g, "/") + "." + extension;
        } else if (!normalized.endsWith("." + extension)) {
             normalized += "." + extension;
        }
	}
    
	return normalized;
}
