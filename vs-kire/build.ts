// getted in https://github.com/oven-sh/bun/issues/6351#issuecomment-1760508292
import packageJson from './package.json';

function getExternalsFromPackageJson(): string[] {
  const sections: (keyof typeof packageJson)[] = [
    'dependencies',
    'devDependencies',
    'peerDependencies' as any,
  ];
  const externals: string[] = [];

  for (const section of sections) {
    if (packageJson[section]) {
      externals.push(...Object.keys(packageJson[section]));
    }
  }

  // Removing potential duplicates between dev and peer
  return Array.from(new Set(externals));
}

async function buildWithExternals(): Promise<void> {
  const externalDeps = getExternalsFromPackageJson();

  await Bun.build({
    entrypoints: ['./src/extension.ts'],
    outdir: './dist',
    target: 'node',
    external: [...externalDeps, 'vscode'],
    root: './src',
  });
}

buildWithExternals();
