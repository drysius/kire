import { $ } from 'bun'
import { Kire } from '../core/src'; // Path adjusted relative to tools/
import { existsSync, writeFileSync } from 'fs'
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import pkg from '../core/package.json'; // Path adjusted
import path from 'path';
import { getPackages, type PackageInfo } from './utils'; // Shared utils
import { glob } from 'glob';

// Generate Root Schema
const kire = new Kire();
writeFileSync('kire-schema.json', JSON.stringify(kire.pkgSchema(
    pkg.name,
    pkg.repository,
    pkg.version,
), null, 3))

class Builder {
    private async cleanPublishDirectory(): Promise<void> {
        if (existsSync('publish')) {
            console.log('🧹 Cleaning publish directory...')
            await rm('publish', { recursive: true })
        }
    }

    /**
     * Cleans up accidental .d.ts files in src directories
     */
    private async cleanSrcTypes(): Promise<void> {
        const files = await glob(['core/src/**/*.d.ts', 'packages/*/src/**/*.d.ts', 'vs-kire/src/**/*.d.ts']);
        for (const file of files) {
            await rm(file);
        }
    }

    private async generateTypes(pkg: PackageInfo): Promise<void> {
        console.log(`📝 Generating types for ${pkg.name}...`);
        
        // Output directory must be absolute for reliable TSC behavior
        const outDir = path.resolve(process.cwd(), pkg.publishPath, 'dist/types');
        await mkdir(outDir, { recursive: true });

        const tempConfigPath = path.resolve(process.cwd(), pkg.path, 'tsconfig.build.tmp.json');
        
        const normalizedPath = pkg.path.replace(/\//g, '/');
        const depth = normalizedPath.split('/').length;
        const relativeRoot = Array(depth).fill('..').join('/');
        const extendsPath = `${relativeRoot}/tsconfig.base.build.json`;

        // We use absolute paths for declarationDir to avoid any ambiguity
        const tempConfig = {
            extends: extendsPath,
            compilerOptions: {
                declaration: true,
                emitDeclarationOnly: true,
                declarationDir: outDir,
                noEmit: false,
                rootDir: "src", 
                baseUrl: ".",
                skipLibCheck: true,
                paths: {
                    "*": ["node_modules/*"]
                }
            },
            include: ["src/**/*"],
            exclude: ["src/**/*.test.ts", "tests", "dist", "node_modules"]
        };

        if (pkg.name !== 'kire') {
             const coreTypesPath = path.resolve(process.cwd(), 'publish/core/dist/types/index.d.ts');
             // @ts-ignore
             tempConfig.compilerOptions.paths["kire"] = [coreTypesPath];
             // @ts-ignore
             tempConfig.compilerOptions.paths["@kirejs/*"] = [`${relativeRoot}/packages/*/src/index.ts`];
        } else {
             // @ts-ignore
             tempConfig.compilerOptions.paths["@kirejs/*"] = [`${relativeRoot}/packages/*/src/index.ts`];
        }

        await writeFile(tempConfigPath, JSON.stringify(tempConfig, null, 2));

        try {
            // Run tsc from the package directory to ensure it picks up the right context
            await $`bunx tsc -p ${tempConfigPath}`.cwd(pkg.path);
        } catch (e: any) {
            console.warn(`⚠️  Type generation had issues for ${pkg.name}:`);
            if (e.stdout) console.log(e.stdout.toString());
            else console.log(e.message);
        } finally {
            if (existsSync(tempConfigPath)) {
                await rm(tempConfigPath);
            }
        }
    }

    private async buildBundles(pkg: PackageInfo): Promise<void> {
        console.log(`🔨 Bundling ${pkg.name}...`);
        const entry = `${pkg.path}/src/index.ts`;
        if (!existsSync(entry)) {
            console.log(`⏭️  Skipping bundle for ${pkg.name} (no src/index.ts)`);
            return;
        }

        const cjsDir = `${pkg.publishPath}/dist/cjs`;
        const esmDir = `${pkg.publishPath}/dist/esm`;

        // Removed --minify as requested
        await $`bun build ${entry} --outdir ${esmDir} --format esm --target node --packages external`;
        await $`bun build ${entry} --outdir ${cjsDir} --format cjs --target node --packages external`;

        await writeFile(`${cjsDir}/package.json`, JSON.stringify({ type: "commonjs" }));
        await writeFile(`${esmDir}/package.json`, JSON.stringify({ type: "module" }));
    }

    private async runPrebuild(pkg: PackageInfo): Promise<void> {
        if (pkg.scripts && pkg.scripts.prebuild) {
            console.log(`⚡ Running prebuild for ${pkg.name}...`);
            await $`bun run prebuild`.cwd(pkg.path);
            
            const sourceDist = `${pkg.path}/dist`;
            if (existsSync(sourceDist)) {
                console.log(`   Copying prebuild assets from ${sourceDist}...`);
                await cp(sourceDist, `${pkg.publishPath}/dist`, { recursive: true, force: true });
            }
        }
    }

    private async copyMetaFiles(pkg: PackageInfo): Promise<void> {
        const files = ['README.md', 'LICENSE', 'kire-schema.json'];
        for (const file of files) {
            const src = `${pkg.path}/${file}`;
            if (existsSync(src)) {
                await cp(src, `${pkg.publishPath}/${file}`);
            }
        }
    }

    private async generatePackageJson(pkg: PackageInfo): Promise<void> {
        const content = JSON.parse(JSON.stringify(pkg.json));
        const destJsonPath = `${pkg.publishPath}/package.json`;
        
        content.main = "./dist/cjs/index.js";
        content.module = "./dist/esm/index.js";
        content.types = "./dist/types/index.d.ts";
        
        if (!content.exports) content.exports = {};
        
        content.exports["."] = {
            "types": "./dist/types/index.d.ts",
            "import": "./dist/esm/index.js",
            "require": "./dist/cjs/index.js"
        };
        
        delete content.scripts;
        delete content.devDependencies;

        const packages = await getPackages();
        const packageMap = new Map(packages.map(p => [p.name, p]));

        if (content.dependencies) {
            for (const [dep, ver] of Object.entries(content.dependencies)) {
                if ((ver as string).startsWith('workspace:')) {
                    const depPkg = packageMap.get(dep);
                    if (depPkg) {
                        content.dependencies[dep] = depPkg.version;
                    } else {
                        content.dependencies[dep] = (ver as string).replace('workspace:', '');
                    }
                }
            }
        }

        await writeFile(destJsonPath, JSON.stringify(content, null, 2));
    }

    public async build(): Promise<void> {
        await this.cleanPublishDirectory();
        
        console.log('📜 Running schema generator...');
        await $`bun run tools/schema.ts`;

        const packages = await getPackages();

        for (const pkg of packages) {
            console.log(`
🏗️  Processing ${pkg.name}...`);
            await this.runPrebuild(pkg);
            await this.generateTypes(pkg);
            await this.buildBundles(pkg);
            await this.copyMetaFiles(pkg);
            await this.generatePackageJson(pkg);
        }

        // Final cleanup of accidental types in src
        await this.cleanSrcTypes();

        console.log('\n✅ Build completed successfully!');
    }
}

new Builder().build().catch(e => {
    console.error(e);
    process.exit(1);
});