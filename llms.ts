import { existsSync } from 'fs';
import { readFile, writeFile, rm } from 'fs/promises';
import { glob } from 'glob';
import { dirname, join, sep, normalize } from 'path';

interface PackageInfo {
    name: string;
    path: string;
}

class PackageRegistry {
    private packages = new Map<string, PackageInfo>();

    async discoverPackages(): Promise<void> {
        // Verificar diferentes padrões de estrutura
        const patterns = [
            'packages/*/package.json',
            'core/package.json', 
            'vs-kire/package.json'
        ];

        for (const pattern of patterns) {
            const packageJsonPaths = await glob(pattern, { windowsPathsNoEscape: true });
            
            for (const pkgJsonPath of packageJsonPaths) {
                if (!existsSync(pkgJsonPath)) continue;

                try {
                    const content = await readFile(pkgJsonPath, 'utf-8');
                    const pkg = JSON.parse(content);
                    
                    // Obter diretório do package.json (remover /package.json do final)
                    const packageDir = dirname(pkgJsonPath);
                    
                    this.packages.set(pkg.name, {
                        name: pkg.name,
                        path: packageDir,
                    });

                    console.log(`📦 Discovered ${pkg.name} at ${packageDir}`);
                } catch (error) {
                    console.warn(`⚠️  Error reading ${pkgJsonPath}: ${error}`);
                }
            }
        }
    }

    getAllPackages(): PackageInfo[] {
        return Array.from(this.packages.values());
    }
}

class LLMSBuilder {
    async buildProject(packageInfo: PackageInfo): Promise<void> {
        const { name, path } = packageInfo;
        console.log(`🔨 Building llms.ts for ${name} in ${path}`);
        
        // Normalizar o caminho para o formato correto do sistema
        const normalizedPath = normalize(path);
        
        // Procurar arquivos TypeScript em múltiplos locais possíveis
        // Usar join para garantir caminhos corretos
        const possiblePatterns = [
            join(normalizedPath, 'src', '**', '*.ts'),
            join(normalizedPath, 'src', '**', '*.tsx'),
            join(normalizedPath, 'lib', '**', '*.ts'),
            join(normalizedPath, '**', '*.ts'),
            join(normalizedPath, '**', '*.tsx')
        ];

        console.log(`   🔍 Searching in: ${normalizedPath}`);

        let sourceFiles: string[] = [];
        
        for (const pattern of possiblePatterns) {
            try {
                const files = await glob(pattern, {
                    ignore: [
                        '**/*.test.ts',
                        '**/*.spec.ts',
                        '**/*.test.tsx',
                        '**/*.spec.tsx',
                        '**/tests/**',
                        '**/test/**',
                        '**/__tests__/**',
                        '**/__test__/**',
                        '**/node_modules/**',
                        '**/dist/**',
                        '**/build/**',
                        '**/coverage/**',
                        '**/.git/**',
                        '**/llms.txt'
                    ],
                    windowsPathsNoEscape: true
                });
                
                if (files.length > 0) {
                    console.log(`   📁 Found ${files.length} files with pattern`);
                }
                sourceFiles.push(...files);
            } catch (error) {
                console.warn(`   ⚠️  Error with pattern: ${error}`);
            }
        }

        // Remover duplicados
        sourceFiles = [...new Set(sourceFiles)];

        if (sourceFiles.length === 0) {
            console.warn(`⚠️  No TypeScript files found for ${name}`);
            
            // Debug: tentar listar com glob simples
            try {
                const simplePattern = join(normalizedPath, '*');
                const dirContents = await glob(simplePattern, { 
                    ignore: ['**/node_modules/**', '**/.git/**'],
                    windowsPathsNoEscape: true
                });
                
                console.log(`   📂 Directory structure:`);
                
                // Listar apenas o primeiro nível
                const firstLevel = dirContents.map(item => {
                    const relative = item.replace(normalizedPath + sep, '');
                    const isDir = !item.includes('.');
                    return `${isDir ? '📁' : '📄'} ${relative}`;
                });
                
                firstLevel.slice(0, 10).forEach(item => console.log(`     ${item}`));
                
                if (firstLevel.length === 0) {
                    console.log(`     (empty directory or permission issue)`);
                }
            } catch (error) {
                console.warn(`   ⚠️  Could not list directory: ${error}`);
            }
            
            return;
        }

        console.log(`📄 Found ${sourceFiles.length} TypeScript files for ${name}`);

        let combinedContent = `// Combined source for ${name}\n`;
        combinedContent += `// Generated at: ${new Date().toISOString()}\n`;
        combinedContent += `// Total files: ${sourceFiles.length}\n\n`;

        let totalFilesProcessed = 0;
        let totalSize = 0;

        for (const filePath of sourceFiles) {
            // Ignorar arquivos de configuração
            const ignoredExtensions = ['.json', '.lock', '.md', '.txt'];
            const fileName = filePath.split(sep).pop() || '';
            const fileExt = fileName.includes('.') ? '.' + fileName.split('.').pop()?.toLowerCase() : '';
            
            if (fileExt && ignoredExtensions.includes(fileExt)) {
                continue;
            }

            try {
                const fileContent = await readFile(filePath, 'utf-8');
                
                // Verificar se o arquivo não está vazio
                if (fileContent.trim().length === 0) {
                    continue;
                }
                
                combinedContent += `\n// ========================================\n`;
                combinedContent += `// File: ${filePath}\n`;
                combinedContent += `// ========================================\n\n`;
                combinedContent += `${fileContent}\n`;
                
                totalFilesProcessed++;
                totalSize += fileContent.length;
                
            } catch (error) {
                console.warn(`⚠️  Could not read file ${filePath}: ${error}`);
            }
        }

        const outputPath = join(normalizedPath, 'llms.txt');
        
        if (existsSync(outputPath)) {
            await rm(outputPath);
        }
        
        if (totalFilesProcessed === 0) {
            console.warn(`⚠️  No content to write for ${name}`);
            combinedContent += `\n// No TypeScript source files found or all files were empty/ignored.\n`;
        }
        
        await writeFile(outputPath, combinedContent, 'utf-8');
        console.log(`✅ llms.txt created for ${name}`);
        console.log(`   📁 Location: ${outputPath}`);
        console.log(`   📊 Files included: ${totalFilesProcessed}`);
        console.log(`   📏 Total size: ${Math.round(totalSize / 1024)} KB`);
    }
}

class Builder {
    private registry = new PackageRegistry();
    private llmsBuilder = new LLMSBuilder();

    public async build(): Promise<void> {
        console.log('🚀 Starting llms-build process...\n');
        console.log(`📁 Current directory: ${process.cwd()}\n`);

        await this.registry.discoverPackages();
        const packages = this.registry.getAllPackages();

        if (packages.length === 0) {
            console.error('❌ No packages found!');
            return;
        }

        console.log(`📦 Found ${packages.length} package(s):`);
        packages.forEach(pkg => console.log(`   • ${pkg.name} (${pkg.path})`));
        console.log('');

        for (const packageInfo of packages) {
            console.log(`\n═══ Processing ${packageInfo.name} ═══`);
            await this.llmsBuilder.buildProject(packageInfo);
        }

        console.log('\n✅ llms-build completed!');
    }
}

// Execute build
const builder = new Builder();
builder.build().catch(console.error);