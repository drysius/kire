import { existsSync } from 'fs';
import { readFile, writeFile, rm } from 'fs/promises';
import { glob } from 'glob';
import { join, sep, normalize } from 'path';
import { getPackages, type PackageInfo } from './utils';

class LLMSBuilder {
    async buildProject(packageInfo: PackageInfo): Promise<void> {
        const { name, path } = packageInfo;
        console.log(`🔨 Building llms.ts for ${name} in ${path}`);
        
        const normalizedPath = normalize(path);
        
        const possiblePatterns = [
            join(normalizedPath, 'src', '**', '*.ts'),
            join(normalizedPath, 'src', '**', '*.tsx'),
            join(normalizedPath, 'lib', '**', '*.ts'),
            // Avoid greedy patterns that might catch too much if structure is standard
            // join(normalizedPath, '**', '*.ts'), 
        ];

        console.log(`   🔍 Searching in: ${normalizedPath}`);

        let sourceFiles: string[] = [];
        
        for (const pattern of possiblePatterns) {
            try {
                const files = await glob(pattern, {
                    ignore: [
                        '**/*.test.ts',
                        '**/*.spec.ts',
                        '**/tests/**',
                        '**/node_modules/**',
                        '**/dist/**',
                        '**/.git/**',
                        '**/llms.txt'
                    ],
                    windowsPathsNoEscape: true
                });
                
                sourceFiles.push(...files);
            } catch (error) {
                console.warn(`   ⚠️  Error with pattern: ${error}`);
            }
        }

        sourceFiles = [...new Set(sourceFiles)];

        if (sourceFiles.length === 0) {
            console.warn(`⚠️  No TypeScript files found for ${name}`);
            return;
        }

        console.log(`📄 Found ${sourceFiles.length} TypeScript files for ${name}`);

        let combinedContent = `// Combined source for ${name}\n`;
        combinedContent += `// Generated at: ${new Date().toISOString()}\n`;
        combinedContent += `// Total files: ${sourceFiles.length}\n\n`;

        let totalFilesProcessed = 0;
        let totalSize = 0;

        for (const filePath of sourceFiles) {
            const fileName = filePath.split(sep).pop() || '';
            if (fileName.startsWith('.')) continue;

            try {
                const fileContent = await readFile(filePath, 'utf-8');
                
                if (fileContent.trim().length === 0) continue;
                
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
        
        await writeFile(outputPath, combinedContent, 'utf-8');
        console.log(`✅ llms.txt created for ${name} (${totalFilesProcessed} files, ${Math.round(totalSize / 1024)} KB)`);
    }
}

class Builder {
    private llmsBuilder = new LLMSBuilder();

    public async build(): Promise<void> {
        console.log('🚀 Starting llms-build process...\n');
        
        const packages = await getPackages();

        if (packages.length === 0) {
            console.error('❌ No packages found!');
            return;
        }

        for (const packageInfo of packages) {
            await this.llmsBuilder.buildProject(packageInfo);
        }

        console.log('\n✅ llms-build completed!');
    }
}

new Builder().build().catch(console.error);
