import type { Kire } from "../kire";

export function compileAndBuild(this: Kire<any>, directories: string[], outputFile: string) {
    const bundled: Record<string, string> = {};

    const scan = (dir: string) => {
        if (!this.$platform.exists(dir)) return;
        
        const items = this.$platform.readDir(dir);
        for (const item of items) {
            const fullPath = this.$platform.join(dir, item);
            const stat = this.$platform.stat(fullPath);
            
            if (stat.isDirectory()) {
                scan(fullPath);
            } else if (stat.isFile() && (fullPath.endsWith(this.$extension) || fullPath.endsWith('.kire'))) {
                const content = this.$platform.readFile(fullPath);
                const resolved = this.$platform.relative(this.$root, fullPath);
                
                // Compila o arquivo e registra no cache
                const entry = this.compile(content, resolved);
                this.$cache.files.set(resolved, entry);
                
                // Prepara para o bundle
                bundled[resolved] = entry.async 
                    ? `async function($props = {}, $globals = {}, $kire) {
${entry.code}
}`
                    : `function($props = {}, $globals = {}, $kire) {
${entry.code}
}`;
            }
        }
    };

    for (const dir of directories) {
        scan(this.$platform.resolve(this.$root, dir));
    }

    const exportLine = typeof module !== 'undefined' 
        ? 'module.exports = _kire_bundled;' 
        : 'export default _kire_bundled;';

    const output = `// Kire Bundled Templates
// Generated at ${new Date().toISOString()}

const _kire_bundled = {
${Object.entries(bundled).map(([key, fn]) => `  "${key}": ${fn}`).join(',
')}
};

${exportLine}
`;

    this.$platform.writeFile(outputFile, output);
}
