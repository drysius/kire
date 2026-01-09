import { $ } from 'bun'
import { Kire } from './core/src';
import { exec } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { glob } from 'glob'
import { promisify } from 'util'
import pkg from './core/package.json';

const kire = new Kire();

writeFileSync('kire-schema.json', JSON.stringify(kire.pkgSchema(
	pkg.name,
	pkg.repository,
	pkg.version,
), null, 3))

const execAsync = promisify(exec)

interface PackageInfo {
	name: string
	version: string
	path: string
	publishPath: string
	scripts?: Record<string, string>
}

class PackageRegistry {
	private packages = new Map<string, PackageInfo>()

	async discoverPackages(): Promise<void> {
		const packagePaths = await glob(['packages/*/', 'core'])

		for (const packagePath of packagePaths) {
			const pkgJsonPath = `${packagePath}/package.json`
			if (!existsSync(pkgJsonPath)) continue

			const content = await readFile(pkgJsonPath, 'utf-8')
			const pkg = JSON.parse(content)

			const packageName = packagePath.split('/').pop() || packagePath
			const publishPath = `publish/${packageName}`

			this.packages.set(pkg.name, {
				name: pkg.name,
				version: pkg.version,
				path: packagePath,
				publishPath,
				scripts: pkg.scripts
			})

			console.log(`📦 ${pkg.name}@${pkg.version} -> ${publishPath}`)
		}
	}

	getPackageByName(name: string): PackageInfo | undefined {
		return this.packages.get(name)
	}

	getAllPackages(): PackageInfo[] {
		return Array.from(this.packages.values())
	}
}

class TypeScriptBuilder {
	async generateTypes(): Promise<void> {
		console.log('📝 Generating TypeScript declarations...')

		if (existsSync('core/dist')) {
			await rm('core/dist', { recursive: true })
		}

		await execAsync(`bunx tsc -p core/tsconfig.build.json --noEmit false`)
		console.log('✅ TypeScript declarations generated')
	}

	async copyTypesToPublish(): Promise<void> {
		console.log('📝 Copying type definitions...')

		// Copiar tipos do core
		if (existsSync('core/dist/types')) {
			await mkdir('publish/core/dist/types', { recursive: true })
			await cp('core/dist/types', 'publish/core/dist/types', { recursive: true })
		}

		// Copiar tipos dos packages
		const packages = await glob('core/dist/types/packages/*')
		for (const packagePath of packages) {
			const packageName = packagePath.split('/').pop()
			if (!packageName) continue

			const targetPath = `publish/${packageName}/dist/types`
			await mkdir(targetPath, { recursive: true })

			if (existsSync(packagePath)) {
				await cp(packagePath + '/src', targetPath, { recursive: true })
			}
		}
		await rm('core/dist', { recursive: true })

		console.log('✅ Type definitions copied')
	}
}

class BundleBuilder {
	private async runPrebuildScript(packageInfo: PackageInfo): Promise<void> {
		const { name, path, scripts } = packageInfo

		if (scripts && scripts.prebuild) {
			console.log(`⚡ Running prebuild script for ${name}`)
			try {
				await execAsync(`cd ${path} && bun run prebuild`)
				console.log(`✅ Prebuild script executed for ${name}`)
			} catch (error) {
				console.error(`❌ Prebuild script failed for ${name}:`, error)
				throw error
			}
		} else {
			console.log(`⏭️  No prebuild script found for ${name}`)
		}
	}

	async buildPackage(packageInfo: PackageInfo): Promise<void> {
		const { name, path, publishPath } = packageInfo

		console.log(`🔨 Building ${name}`)

		// Executar script prebuild se existir
		await this.runPrebuildScript(packageInfo)

		// Criar diretórios de saída
		await mkdir(`${publishPath}/dist/cjs`, { recursive: true })
		await mkdir(`${publishPath}/dist/esm`, { recursive: true })

		// Build CJS
		console.log(`📦 Building CJS for ${name}`)
		await execAsync(`bun build ${path}/src/index.ts \
      --outdir ${publishPath}/dist/cjs \
      --format cjs \
      --target node \
      --packages external \
      --minify`)

		// Build ESM
		console.log(`📦 Building ESM for ${name}`)
		try {
			await $`bun build ${path}/src/index.ts \
        --outdir ${publishPath}/dist/esm \
        --format esm \
        --target node \
        --packages external \
        --minify`
		} catch (error) {
			console.error(`❌ Failed to build ESM for ${name}:`, error)
			// Tentar abordagem alternativa se falhar
			console.log(`🔄 Trying alternative ESM build for ${name}...`)
			await execAsync(`bun build ${path}/src/index.ts \
        --outdir ${publishPath}/dist/esm \
        --format esm \
        --target node \
        --packages external \
        --minify`)
		}

		// Criar package.json files para módulos
		await writeFile(`${publishPath}/dist/cjs/package.json`, JSON.stringify({ type: "commonjs" }))
		await writeFile(`${publishPath}/dist/esm/package.json`, JSON.stringify({ type: "module" }))

		// Atualizar package.json principal com exports
		await this.updatePackageExports(packageInfo)

		// Copiar assets
		await this.copyAssets(path, publishPath)

		console.log(`✅ Finished ${name}`)
	}

	private async updatePackageExports(packageInfo: PackageInfo): Promise<void> {
		const { publishPath, name } = packageInfo

		const manifestPath = `${publishPath}/package.json`
		if (!existsSync(manifestPath)) return

		try {
			const content = await readFile(manifestPath, 'utf-8')
			const pkg = JSON.parse(content)

			// Atualizar exports
			pkg.main = "./dist/cjs/index.js"
			pkg.module = "./dist/esm/index.js"
			pkg.types = "./dist/types/index.d.ts"

			pkg.exports = {
				".": {
					"types": "./dist/types/index.d.ts",
					"import": "./dist/esm/index.js",
					"require": "./dist/cjs/index.js"
				}
			}

			// Adicionar files se não existir
			if (!pkg.files) {
				pkg.files = ["dist", "README.md", "LICENSE"]
			}

			await writeFile(manifestPath, JSON.stringify(pkg, null, 2))
			console.log(`📄 Updated package.json exports for ${name}`)
		} catch (error) {
			console.error(`❌ Failed to update package.json for ${name}:`, error)
		}
	}

	private async copyAssets(sourcePath: string, publishPath: string): Promise<void> {
		const assets = ['README.md', 'LICENSE']

		for (const asset of assets) {
			const sourceFile = `${sourcePath}/${asset}`
			if (existsSync(sourceFile)) {
				await cp(sourceFile, `${publishPath}/${asset}`)
			}
		}
	}
}

class DependencyManager {
	constructor(private registry: PackageRegistry) { }

	async replaceWorkspaceDependencies(packageInfo: PackageInfo): Promise<void> {
		const { publishPath, name } = packageInfo
		console.log(`🔗 Updating dependencies in ${name}`)

		const manifestPath = `${publishPath}/package.json`
		if (!existsSync(manifestPath)) return

		const content = await readFile(manifestPath, 'utf-8')
		const pkg = JSON.parse(content)

		let hasChanges = false

		for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
			const deps = pkg[field]
			if (!deps) continue

			for (const [depName, depVersion] of Object.entries(deps)) {
				if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
					const targetPackage = this.registry.getPackageByName(depName)
					if (targetPackage) {
						deps[depName] = targetPackage.version
						hasChanges = true
						console.log(`  ↳ ${depName}: ${depVersion} → ${targetPackage.version}`)
					}
				}
			}
		}

		if (hasChanges) {
			await writeFile(manifestPath, JSON.stringify(pkg, null, 2))
		}
	}
}

class Builder {
	private registry = new PackageRegistry()
	private tsBuilder = new TypeScriptBuilder()
	private bundleBuilder = new BundleBuilder()
	private dependencyManager = new DependencyManager(this.registry)

	private async cleanPublishDirectory(): Promise<void> {
		if (existsSync('publish')) {
			console.log('🧹 Cleaning publish directory...')
			await rm('publish', { recursive: true })
		}
	}

	public async build(): Promise<void> {
		console.log('🚀 Starting build process...\n')

		await this.cleanPublishDirectory()
		await this.registry.discoverPackages()
		await this.tsBuilder.generateTypes()

		const packages = this.registry.getAllPackages()

		// Build todos os packages
		for (const packageInfo of packages) {
			console.log(`\n═══ Building ${packageInfo.name} ═══`)
			try {
				await this.bundleBuilder.buildPackage(packageInfo)
			} catch (error) {
				console.error(`❌ Failed to build ${packageInfo.name}:`, error)
				process.exit(1)
			}
		}

		// Copiar tipos após o build
		await this.tsBuilder.copyTypesToPublish()

		// Atualizar dependências
		console.log('\n🔗 Updating workspace dependencies...')
		for (const packageInfo of packages) {
			try {
				await this.dependencyManager.replaceWorkspaceDependencies(packageInfo)
			} catch (error) {
				console.error(`❌ Failed to update dependencies for ${packageInfo.name}:`, error)
			}
		}

		// Resumo final
		console.log('\n✅ Build completed!')
		console.log('📦 Packages built:')
		packages.forEach(pkg => {
			console.log(`   • ${pkg.name}@${pkg.version}`)
		})
	}
}

// Executar build
const builder = new Builder()
builder.build().catch(console.error)